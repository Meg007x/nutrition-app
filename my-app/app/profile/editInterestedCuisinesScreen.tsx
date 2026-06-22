import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE } from '@/style/editInterestedCuisines.styles';

// รายการอาหารอ้างอิงจากโครงสร้าง Step 8 ของคุณ
const MOCK_CUISINES = [
  "อาหารอเมริกัน",
  "อาหารเอเชีย",
  "อาหารจีน",
  "อาหารอินเดีย",
  "อาหารอิตาลี",
  "อาหารญี่ปุ่น",
  "อาหารแม็กซิกัน",
  "อาหารไทย"
];

export default function EditInterestedCuisinesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // เก็บรายการอาหารที่ผู้ใช้เลือก (ใน DB เป็นอาร์เรย์ของข้อความตรงๆ เช่น ["อาหารไทย", "อาหารญี่ปุ่น"])
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // แบนเนอร์แจ้งเตือน Smart Banner
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success'
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const loadUserProfile = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      
      const userId = userObj.user_id; // 🟢 ป้องกัน 404: บังคับใช้ user_id หลักในการเรียกข้อมูล
      if (!userId) return;
      setCurrentUserId(userId);

      // ดึงโปรไฟล์ล่าสุดจาก API ของคุณ
      const response = await fetch(`http://localhost:3000/api/users/profile?userId=${userId}`);
      const json = await response.json();

      if (json.success && json.data) {
        // แปะค่าเริ่มต้นที่เคยเลือกไว้เข้าสู่หน้าจอ (กันเหนียวถ้าฟิลด์ไม่มีค่าให้ตั้งเป็นอาร์เรย์ว่าง)
        setSelectedCuisines(json.data.interested_cuisines || []);
      }
    } catch (error) {
      console.error("❌ Error ดึงข้อมูลอาหารที่สนใจ:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสลับการเลือกอาหาร (เลือกเพิ่ม หรือ ติ๊กออก)
  const toggleSelection = (cuisineName: string) => {
    if (selectedCuisines.includes(cuisineName)) {
      setSelectedCuisines(selectedCuisines.filter(item => item !== cuisineName));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisineName]);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);

    const payload = {
      userId: currentUserId,
      interested_cuisines: selectedCuisines // ส่งกลับฐานข้อมูลเป็น Array ข้อความตรงๆ
    };

    try {
      const response = await fetch('http://localhost:3000/api/users/update-interested-cuisines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        showNotification("🎉 อัปเดตประเภทอาหารที่คุณชอบสำเร็จ!", "success");
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
        <Text style={styles.headerTitle}>อาหารที่สนใจ</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ประเภทอาหารที่คุณชอบ</Text>
        <Text style={styles.sectionDesc}>เลือกสไตล์อาหารที่คุณอยากทาน ระบบจะช่วยแนะนำเมนูจานโปรดในหมวดหมู่เหล่านี้ให้คุณบ่อยขึ้นครับ</Text>

        <View style={styles.listContainer}>
          {MOCK_CUISINES.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine);
            return (
              <TouchableOpacity
                key={cuisine}
                style={isSelected ? styles.cuisineItemSelected : styles.cuisineItemUnselected}
                activeOpacity={0.7}
                onPress={() => toggleSelection(cuisine)}
              >
                <Text style={isSelected ? styles.cuisineTextSelected : styles.cuisineTextUnselected}>
                  {cuisine}
                </Text>
                
                {/* แสดงไอคอนติ๊กถูกสีส้ม ขวาการ์ด เมื่ออันนั้นโดนเลือก */}
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={ORANGE} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}