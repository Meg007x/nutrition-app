import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  ActivityIndicator, 
  Keyboard,
  Platform,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ดึงไฟล์ CSS เดิมมาใช้
import { styles, ORANGE, IOS_GREEN, ERROR_COLOR } from '@/style/editActivity.styles';

const activityOptions = [
  { label: "น้อย", value: "light", desc: "นั่งทำงานเป็นส่วนใหญ่ หรือออกกำลังกายน้อยมาก" },
  { label: "ปานกลาง", value: "moderate", desc: "มีการเดินหรือออกกำลังกายเบาๆ 2-3 วันต่อสัปดาห์" },
  { label: "มาก", value: "active", desc: "ออกกำลังกายสม่ำเสมอ หรือใช้ร่างกายค่อนข้างมาก" },
  { label: "หนัก", value: "very_active", desc: "ออกกำลังกายหนักหรือใช้แรงงานเป็นประจำเกือบทุกวัน" },
];

const mapActivityFromDB: any = { "น้อย": "light", "ปานกลาง": "moderate", "มาก": "active", "หนัก": "very_active" };
const mapActivityToDB: any = { "light": "น้อย", "moderate": "ปานกลาง", "active": "มาก", "very_active": "หนัก" };

export default function EditActivityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [selectedActivity, setSelectedActivity] = useState('moderate');
  const [proteinMode, setProteinMode] = useState<'auto' | 'custom'>('auto');
  const [customProtein, setCustomProtein] = useState('');
  const [originalProtein, setOriginalProtein] = useState('');

  // 🔔 State สำหรับควบคุมการแสดงผล Notification ด้านบน
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  // ฟังก์ชันเปิดแจ้งเตือนสไตล์สมัยใหม่
  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    // ให้แสดงค้างไว้ 2.5 วินาทีแล้วจางหายไปอัตโนมัติ
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  const loadUserProfile = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      const userId = userObj.user_id || userObj.id || userObj._id;

      const response = await fetch(`http://localhost:3000/api/users/profile?userId=${userId}`);
      const json = await response.json();

      if (json.success && json.data) {
        const user = json.data;
        setUserData(user); 
        
        if (user.health_goals) {
          if (user.health_goals.activity_level) {
            const dbActivity = user.health_goals.activity_level;
            setSelectedActivity(mapActivityFromDB[dbActivity] || 'moderate');
          }
          if (user.health_goals.protein_target_g) {
            const savedProtein = String(user.health_goals.protein_target_g);
            setCustomProtein(savedProtein);
            setOriginalProtein(savedProtein);
            setProteinMode('custom'); 
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentTDEE = useMemo(() => {
    if (!userData) return 0;
    const { weight_kg, height_cm, age, gender } = userData;
    let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
    bmr += gender === 'ชาย' ? 5 : -161;
    const multipliers: any = { light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    return Math.floor(bmr * (multipliers[selectedActivity] || 1.2));
  }, [userData, selectedActivity]);

  const autoProtein = useMemo(() => {
    if (!userData) return 0;
    const weight = userData.weight_kg || 60;
    const proteinMultipliers: any = { light: 1.2, moderate: 1.6, active: 1.8, very_active: 2.0 };
    return Math.floor(weight * (proteinMultipliers[selectedActivity] || 1.6));
  }, [userData, selectedActivity]);

  const validateProtein = () => {
    if (!userData) return { status: 'ok', msg: '' };
    const weight = userData.weight_kg || 60;
    const min = Math.floor(weight * 0.8);
    const max = Math.floor(weight * 3.0);
    const val = parseFloat(customProtein);

    if (!customProtein || isNaN(val) || val <= 0) return { status: 'error', msg: 'กรุณาระบุตัวเลขที่ถูกต้อง' };
    if (val < min) return { status: 'error', msg: `น้อยเกินไป (ขั้นต่ำควรได้ ${min} กรัม/วัน)` };
    if (val > max) return { status: 'error', msg: `มากเกินไป (ไม่ควรรับเกิน ${max} กรัม/วัน)` };
    return { status: 'success', msg: `อยู่ในเกณฑ์ที่เหมาะสม (แนะนำ ${min}-${max} กรัม)` };
  };

  const validation = proteinMode === 'custom' 
    ? validateProtein() 
    : { status: 'info', msg: `ระบบคำนวณตามเป้าหมายระดับ "${mapActivityToDB[selectedActivity]}"` };

  const handleSafeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/'); 
  };

  const handleSaveActivity = async () => {
    Keyboard.dismiss();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }

    if (proteinMode === 'custom' && validation.status === 'error') {
      showNotification("🚨 กรุณาแก้ไขปริมาณโปรตีนให้ถูกต้องก่อนบันทึก", "error");
      return;
    }
    if (!userData) return;

    setSaving(true);
    const finalProtein = proteinMode === 'custom' ? parseFloat(customProtein) : autoProtein;

    const payload = {
      userId: userData.user_id || userData._id,
      activity_level: mapActivityToDB[selectedActivity] || "ปานกลาง", 
      protein_target_g: finalProtein,
      tdee_target_kcal: currentTDEE
    };

    try {
      const response = await fetch('http://localhost:3000/api/users/update-activity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        // 🟢 บันทึกสำเร็จ: ยิง Notification สไลด์ลงมา แล้วหน่วงเวลาถอยกลับหน้าหลักแบบเนียนๆ
        showNotification("🎉 บันทึกการปรับเปลี่ยนแผนอาหารสำเร็จแล้ว!", "success");
        setTimeout(() => {
          handleSafeBack();
        }, 1200);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { position: 'relative' }]}>
      
      {/* 🚀 SMART BANNER NOTIFICATION (แสดงด้านบนสุดแทน Alert โบราณ) */}
      {toast.visible && (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 50 : 20,
          left: 16,
          right: 16,
          backgroundColor: toast.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          borderColor: toast.type === 'success' ? '#4CAF50' : '#FF5252',
          borderWidth: 1.5,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 9999, // ดันลอยไว้บนสุดของทุกองค์ประกอบ
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 5,
        }}>
          <View style={{ marginRight: 10 }}>
            {toast.type === 'success' ? (
              <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            ) : (
              <Ionicons name="alert-circle" size={24} color="#C62828" />
            )}
          </View>
          <Text style={{ 
            fontFamily: 'NotoSansThaiBold', 
            fontSize: 15, 
            color: toast.type === 'success' ? '#2E7D32' : '#C62828',
            flex: 1 
          }}>
            {toast.message}
          </Text>
        </View>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleSafeBack}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ระดับกิจกรรม & โปรตีน</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>ระดับกิจกรรมในปัจจุบัน</Text>

        {activityOptions.map((item) => {
          const isActive = selectedActivity === item.value;
          return (
            <TouchableOpacity 
              key={item.value} 
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => setSelectedActivity(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>{item.label}</Text>
              <Text style={[styles.cardDesc, isActive && styles.cardDescActive]}>{item.desc}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>เป้าหมายโปรตีนที่ต้องการต่อวัน</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, proteinMode === 'auto' && styles.tabBtnActive]}
            onPress={() => setProteinMode('auto')}
          >
            <Text style={[styles.tabText, proteinMode === 'auto' && styles.tabTextActive]}>คำนวณอัตโนมัติ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, proteinMode === 'custom' && styles.tabBtnActive]}
            onPress={() => setProteinMode('custom')}
          >
            <Text style={[styles.tabText, proteinMode === 'custom' && styles.tabTextActive]}>กำหนดเอง</Text>
          </TouchableOpacity>
        </View>

        {proteinMode === 'auto' ? (
          <View style={[styles.inputRow, { backgroundColor: '#EFEFEF' }]}>
            <TextInput 
              style={[styles.numericInput, { color: '#888' }]} 
              value={String(autoProtein)}
              editable={false} 
            />
            <Text style={styles.unitText}>กรัม / วัน</Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.numericInput}
              keyboardType="numeric"
              placeholder="เช่น 120"
              placeholderTextColor="#A9A9A9"
              value={customProtein}
              onChangeText={(text) => setCustomProtein(text)}
              onFocus={() => { if (customProtein === originalProtein) setCustomProtein(''); }}
              onBlur={() => { if (!customProtein || customProtein.trim() === '') setCustomProtein(originalProtein); }}
            />
            <Text style={styles.unitText}>กรัม / วัน</Text>
          </View>
        )}
        
        <Text style={[
          styles.validationTextNormal, 
          validation.status === 'error' && { color: ERROR_COLOR, fontFamily: 'NotoSansThaiBold' },
          validation.status === 'success' && { color: IOS_GREEN, fontFamily: 'NotoSansThaiBold' }
        ]}>
          {validation.status === 'error' ? '🚨 ' : (validation.status === 'success' ? '✅ ' : '💡 ')}
          {validation.msg}
        </Text>

        <View style={{ backgroundColor: '#E8F5E9', padding: 15, borderRadius: 12, marginTop: 25, borderWidth: 1, borderColor: '#C8E6C9' }}>
          <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 16, color: '#2E7D32', marginBottom: 10 }}>💡 สรุปการปรับแผนอาหารใหม่</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: 'NotoSansThai', fontSize: 15, color: '#333' }}>🔥 แคลอรี่ที่ต้องทาน (TDEE)</Text>
            <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 16, color: '#111' }}>{currentTDEE} kcal</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'NotoSansThai', fontSize: 15, color: '#333' }}>🥩 โปรตีนเป้าหมาย</Text>
            <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 16, color: '#111' }}>
              {proteinMode === 'auto' ? autoProtein : (customProtein || 0)} กรัม
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, (proteinMode === 'custom' && validation.status === 'error') && styles.saveButtonDisabled]} 
          onPress={handleSaveActivity}
          disabled={saving || (proteinMode === 'custom' && validation.status === 'error')}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}