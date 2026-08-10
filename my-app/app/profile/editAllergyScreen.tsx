import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE } from '@/style/editAllergy.styles';
import { BASE_URL } from '../../constants/config';

const ALLERGIES = ["แพ้ถั่ว", "แพ้อาหารทะเล", "แพ้นมวัว", "แพ้กลูเตน", "แพ้ไข่", "แพ้แป้งสาลี"];
const NONE_OPTION = "ไม่มีอาการแพ้";

export default function EditAllergyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(''); // เก็บ user_id ตัวหลัก
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => { loadUserProfile(); }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); }, 2500);
  };

  const loadUserProfile = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      
      // 🟢 บังคับให้หยิบ "user_id" (เช่น U1774508285129) มาใช้งานตามฐานข้อมูลของคุณ
      const userId = userObj.user_id; 
      if (!userId) return;
      
      setCurrentUserId(userId);

      // ยิงไปหาพาร์ทหลังบ้านของคุณพร้อมส่ง ?userId= ผ่านทาง Query Parameter ตามโค้ดที่คุณให้มาเป๊ะๆ
      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${userId}`);
      const json = await response.json();

      if (json.success && json.data) {
        // 🟢 แกะข้อมูลลึกเข้าไปในฟิลด์ allergies.other ตาม Schema จริงในฐานข้อมูล
        let savedAllergies = [];
        if (json.data.allergies && Array.isArray(json.data.allergies.other)) {
          savedAllergies = json.data.allergies.other;
        }
        
        // ถ้าข้อมูลมีอยู่ ให้ใช้ค่าจาก DB ถ้าไม่มีให้เซ็ตเป็นไม่มีอาการแพ้ไว้ก่อน
        setSelectedAllergies(savedAllergies.length > 0 ? savedAllergies : [NONE_OPTION]);
      }
    } catch (error) {
      console.error("❌ Error ดึงข้อมูลโปรไฟล์:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: string) => {
    if (item === NONE_OPTION) {
      setSelectedAllergies([NONE_OPTION]);
      return;
    }
    let newSelected = selectedAllergies.filter((x) => x !== NONE_OPTION);
    if (newSelected.includes(item)) {
      newSelected = newSelected.filter((x) => x !== item);
    } else {
      newSelected.push(item);
    }
    if (newSelected.length === 0) { newSelected = [NONE_OPTION]; }
    setSelectedAllergies(newSelected);
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);

    const payload = {
      userId: currentUserId, // ส่ง user_id ที่ถูกต้องไปให้หลังบ้านค้นหาด้วย User.findOne
      // ถ้าเลือก "ไม่มีอาการแพ้" ให้ส่งอาร์เรย์ที่มีสตริงคำว่า "ไม่มีอาการแพ้" ไปเก็บตรงๆ ตามแบบไฟล์โครงข้อมูลเดิม
      allergies: selectedAllergies 
    };

    try {
      const response = await fetch(`${BASE_URL}/api/users/update-allergies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        showNotification("🎉 บันทึกข้อมูลอาหารที่แพ้สำเร็จ!", "success");
        setTimeout(() => { router.back(); }, 1200);
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
      {/* SMART BANNER NOTIFICATION สไลด์หล่นมาจากด้านบน */}
      {toast.visible && (
        <View style={[{
          position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16,
          backgroundColor: toast.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          borderColor: toast.type === 'success' ? '#4CAF50' : '#FF5252',
          borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
          flexDirection: 'row', alignItems: 'center', zIndex: 9999, elevation: 5,
        }, 
        Platform.OS === 'web' ? ({ boxShadow: '0px 4px 6px rgba(0,0,0,0.15)' } as any) : {}
        ]}>
          <View style={{ marginRight: 10 }}>
            {toast.type === 'success' ? <Ionicons name="checkmark-circle" size={24} color="#2E7D32" /> : <Ionicons name="alert-circle" size={24} color="#C62828" />}
          </View>
          <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 15, color: toast.type === 'success' ? '#2E7D32' : '#C62828', flex: 1 }}>{toast.message}</Text>
        </View>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อาหารที่แพ้</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>เลือกอาหารที่คุณแพ้</Text>
        <View style={styles.chipContainer}>
          {ALLERGIES.map((item) => {
            const isSelected = selectedAllergies.includes(item);
            return (
              <TouchableOpacity key={item} style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleItem(item)} activeOpacity={0.7}>
                <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.chip, styles.chipNone, selectedAllergies.includes(NONE_OPTION) ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleItem(NONE_OPTION)} activeOpacity={0.7}>
            <Text style={[styles.chipText, selectedAllergies.includes(NONE_OPTION) ? styles.chipTextSelected : styles.chipTextUnselected]}>{NONE_OPTION}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, minHeight: 40 }} />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}