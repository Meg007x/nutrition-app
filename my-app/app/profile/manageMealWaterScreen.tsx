import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Switch, ActivityIndicator, Platform, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles, ORANGE, IOS_GREEN, ERROR_RED } from '@/style/manageMealWater.styles';
import { BASE_URL } from '../../constants/config';

interface MealSchedule {
  id: string;
  name: string;
  time: string;
  notify: boolean;
}

export default function ManageMealWaterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [meals, setMeals] = useState<MealSchedule[]>([]);
  const [waterTarget, setWaterTarget] = useState<string>('2000');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success'
  });

  useEffect(() => { loadUserSettings(); }, []);

  const loadUserSettings = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      const userId = userObj.user_id;

      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${userId}`);
      const json = await response.json();

      if (json.success && json.data) {
        setUserData(json.data);
        const data = json.data;
        
        // โหลดมื้ออาหาร
        if (data.meal_settings?.schedules) {
          setMeals(data.meal_settings.schedules.map((m: any, i: number) => ({
            id: m.id || String(i + Date.now()),
            name: m.name,
            time: m.time,
            notify: m.notify ?? true
          })));
        }

        // โหลดเป้าหมายน้ำ
        setWaterTarget(String(data.water_target_ml || 2000));
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // 💡 ระบบคำนวณปริมาณน้ำแนะนำ (สูตร: น้ำหนักตัว x 33)
  const recommendedWater = useMemo(() => {
    if (!userData?.weight_kg) return 2000;
    return Math.round(userData.weight_kg * 33);
  }, [userData]);

  // 💡 ระบบ Validation น้ำดื่ม
  const waterStatus = useMemo(() => {
    const amount = Number(waterTarget);
    if (amount < 1200) return { error: true, msg: "⚠️ ปริมาณน้อยเกินไป (ขั้นต่ำควร 1,200 ml)" };
    if (amount > 4500) return { error: true, msg: "⚠️ ปริมาณมากเกินไป (ไม่ควรเกิน 4,500 ml)" };
    return { error: false, msg: "" };
  }, [waterTarget]);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const handleUpdateMeal = (id: string, key: keyof MealSchedule, value: any) => {
    setMeals(meals.map(m => m.id === id ? { ...m, [key]: value } : m));
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && activeMealId) {
      const time = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
      handleUpdateMeal(activeMealId, 'time', time);
    }
  };

  const handleSaveAll = async () => {
    if (waterStatus.error) {
      showNotification("กรุณาปรับปริมาณน้ำให้เหมาะสม", "error");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/update-meal-water-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user_id,
          meals,
          water_target_ml: Number(waterTarget)
        })
      });
      if (response.ok) {
        showNotification("🎉 บันทึกการตั้งค่าใหม่เรียบร้อยแล้ว", "success");
        setTimeout(() => router.back(), 1200);
      }
    } catch (e) { showNotification("เกิดข้อผิดพลาด", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={ORANGE}/></View>;

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={[{position:'absolute', top:50, left:16, right:16, backgroundColor: toast.type === 'success' ? '#E8F5E9' : '#FFEBEE', borderColor: toast.type === 'success' ? '#4CAF50' : ERROR_RED, borderWidth:1.5, padding:14, borderRadius:14, flexDirection:'row', alignItems:'center', zIndex:9999, elevation:5}, Platform.OS === 'web' && {boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}]}>
          <Ionicons name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} size={24} color={toast.type === 'success' ? '#2E7D32' : ERROR_RED} />
          <Text style={{fontFamily:'NotoSansThaiBold', marginLeft:10, flex:1, color: toast.type === 'success' ? '#2E7D32' : ERROR_RED}}>{toast.message}</Text>
        </View>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>จัดการมื้ออาหารและน้ำดื่ม</Text>
        <View style={{width:28}}/>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* SECTION 1: มื้ออาหาร */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🍽️ แผนมื้ออาหาร</Text>
          <Text style={styles.sectionDesc}>ตั้งชื่อมื้อและเวลาที่คุณสะดวกทาน (เช่น มื้อก่อนออกกำลังกาย)</Text>

          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealItemContainer}>
              <View style={styles.mealHeaderRow}>
                <TextInput 
                  style={styles.mealNameInput}
                  value={meal.name}
                  onChangeText={(t) => handleUpdateMeal(meal.id, 'name', t)}
                  placeholder="ชื่อมื้อ..."
                />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setMeals(meals.filter(m => m.id !== meal.id))}>
                  <Ionicons name="trash" size={18} color={ERROR_RED} />
                </TouchableOpacity>
              </View>

              <View style={styles.mealControlRow}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => { setActiveMealId(meal.id); setShowTimePicker(true); }}>
                  <Ionicons name="time-outline" size={20} color={ORANGE} />
                  <Text style={styles.timeBtnText}>{meal.time}</Text>
                </TouchableOpacity>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                  <Text style={{fontFamily:'NotoSansThai', fontSize:12, color:'#666'}}>แจ้งเตือน</Text>
                  <Switch 
                    value={meal.notify} 
                    onValueChange={(v) => handleUpdateMeal(meal.id, 'notify', v)}
                    trackColor={{ false: "#DDD", true: IOS_GREEN }}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addMealBtn} onPress={() => setMeals([...meals, {id:String(Date.now()), name:'มื้อใหม่', time:'12:00', notify:true}])}>
            <Ionicons name="add-circle" size={22} color={ORANGE} />
            <Text style={styles.addMealBtnText}>เพิ่มมื้ออาหาร</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: น้ำดื่ม */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💧 เป้าหมายการดื่มน้ำ</Text>
          <View style={[styles.waterInputWrapper, waterStatus.error && styles.waterInputError]}>
            <TextInput 
              style={styles.waterTextInput}
              value={waterTarget}
              onChangeText={(t) => setWaterTarget(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={styles.waterUnitText}>มิลลิลิตร (ml)</Text>
          </View>
          <Text style={styles.recommendText}>💡 แนะนำสำหรับคุณ: {recommendedWater} ml (คำนวณจากน้ำหนักตัว)</Text>
          {waterStatus.error && <Text style={styles.warningText}>{waterStatus.msg}</Text>}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} disabled={saving}>
          {saving ? <ActivityIndicator color="white"/> : <Text style={styles.saveButtonText}>บันทึกข้อมูลทั้งหมด</Text>}
        </TouchableOpacity>

      </ScrollView>

      {showTimePicker && (
        <DateTimePicker 
          value={new Date()} 
          mode="time" 
          is24Hour={true} 
          onChange={onTimeChange} 
        />
      )}
    </SafeAreaView>
  );
}