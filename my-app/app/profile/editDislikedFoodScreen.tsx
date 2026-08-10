import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Platform, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE } from '@/style/editDislikedFood.styles';
import { BASE_URL } from '../../constants/config';

// โครงสร้างประเภทข้อมูลที่จัดกลุ่มแล้ว
type GroupedIngredients = {
  [categoryKey: string]: {
    title: string;
    items: string[];
  }
};

export default function EditDislikedFoodScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // เก็บสถานะการเปิด/ปิด Accordion หมวดหมู่
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // เก็บโครงสร้างอาหารจาก DB ที่จัดกลุ่มแล้ว
  const [groupedIngredients, setGroupedIngredients] = useState<GroupedIngredients>({});
  
  // เก็บรายการที่ผู้ใช้เลือก (ติ๊กไม่กิน)
  // รูปแบบ: { nuts: ["วอลนัท"], sweet: ["ไอศกรีม"] }
  const [selectedFoods, setSelectedFoods] = useState<Record<string, string[]>>({});

  // แบนเนอร์แจ้งเตือน
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const loadData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      
      const userId = userObj.user_id; // 🟢 ป้องกัน 404: หยิบ user_id ตรงๆ
      if (!userId) return;
      setCurrentUserId(userId);

      // 🟢 ดึงข้อมูลโปรไฟล์ และ วัตถุดิบ พร้อมกันเพื่อให้ไวขึ้น
      const [profileRes, ingredientsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/users/profile?userId=${userId}`),
        fetch(`${BASE_URL}/api/ingredients`) // 👈 ต้องมี API ดึงวัตถุดิบทั้งหมด
      ]);

      const profileJson = await profileRes.json();
      const ingredientsJson = await ingredientsRes.json();

      // 1. นำวัตถุดิบมาจัดหมวดหมู่
      if (ingredientsJson.success && ingredientsJson.data) {
        const grouped: GroupedIngredients = {};
        ingredientsJson.data.forEach((ing: any) => {
          if (!ing.is_active) return;
          const cat = ing.category; // เช่น "nuts"
          const label = ing.sub_category_label || ing.category_group_label || cat;
          
          if (!grouped[cat]) grouped[cat] = { title: label, items: [] };
          grouped[cat].items.push(ing.name);
        });
        setGroupedIngredients(grouped);
      }

      // 2. นำข้อมูลเก่าที่ผู้ใช้เคยเลือกไว้มาเซ็ตลง State
      if (profileJson.success && profileJson.data && profileJson.data.disliked_foods) {
        setSelectedFoods(profileJson.data.disliked_foods);
      } else {
        setSelectedFoods({});
      }

    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // เปิด/ปิด Accordion ของหมวดหมู่นั้นๆ
  const toggleCategory = (catKey: string) => {
    setExpandedCategory(expandedCategory === catKey ? null : catKey);
  };

  // สลับสถานะวัตถุดิบ (สวิตช์)
  const toggleFood = (catKey: string, foodName: string) => {
    setSelectedFoods(prev => {
      const catFoods = prev[catKey] || [];
      const updatedCatFoods = catFoods.includes(foodName)
        ? catFoods.filter(item => item !== foodName)
        : [...catFoods, foodName];

      return { ...prev, [catKey]: updatedCatFoods };
    });
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);

    const payload = {
      userId: currentUserId,
      disliked_foods: selectedFoods 
    };

    try {
      const response = await fetch(`${BASE_URL}/api/users/update-disliked-foods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        showNotification("🎉 บันทึกรายการที่ไม่ชอบสำเร็จ!", "success");
        setTimeout(() => router.back(), 1200);
      } else {
        showNotification(`❌ บันทึกไม่สำเร็จ: ${json.message}`, "error");
      }
    } catch (error) {
      showNotification("❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🚀 SMART BANNER */}
      {toast.visible && (
        <View style={[{
          position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16,
          backgroundColor: toast.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          borderColor: toast.type === 'success' ? '#4CAF50' : '#FF5252',
          borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
          flexDirection: 'row', alignItems: 'center', zIndex: 9999, elevation: 5,
        }, Platform.OS === 'web' ? ({ boxShadow: '0px 4px 6px rgba(0,0,0,0.15)' } as any) : {}]}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} size={24} color={toast.type === 'success' ? '#2E7D32' : '#C62828'} />
          </View>
          <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 15, color: toast.type === 'success' ? '#2E7D32' : '#C62828', flex: 1 }}>{toast.message}</Text>
        </View>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อาหารที่ไม่ชอบ</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>เลือกวัตถุดิบที่คุณไม่ทาน</Text>

        {Object.keys(groupedIngredients).map(catKey => {
          const category = groupedIngredients[catKey];
          const isExpanded = expandedCategory === catKey;
          const selectedCount = (selectedFoods[catKey] || []).length;

          return (
            <View key={catKey} style={styles.categoryCard}>
              {/* Header ของหมวดหมู่ (กดเพื่อกางออก) */}
              <TouchableOpacity 
                style={styles.categoryHeader} 
                onPress={() => toggleCategory(catKey)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedCount > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>{selectedCount} รายการ</Text></View>
                  )}
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                </View>
              </TouchableOpacity>

              {/* รายการวัตถุดิบ (จะแสดงเมื่อถูกกาง) */}
              {isExpanded && (
                <View style={styles.foodListContainer}>
                  {category.items.map(food => {
                    const isSelected = (selectedFoods[catKey] || []).includes(food);
                    return (
                      <View key={food} style={styles.foodItemRow}>
                        <Text style={styles.foodItemText}>{food}</Text>
                        <Switch
                          value={isSelected}
                          onValueChange={() => toggleFood(catKey, food)}
                          trackColor={{ false: "#D1D1D6", true: "#FAD896" }}
                          thumbColor={isSelected ? ORANGE : "#f4f3f4"}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ flex: 1, minHeight: 40 }} />
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}