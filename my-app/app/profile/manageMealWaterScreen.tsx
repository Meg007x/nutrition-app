import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Switch, ActivityIndicator, Platform, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE, IOS_GREEN, ERROR_RED } from '@/style/manageMealWater.styles';
import { BASE_URL } from '../../constants/config';
import { getWaterTargetRange } from '../../utils/waterTargets';
import { scheduleMealNotifications } from '../../utils/notificationService';

const WATER_STEP_ML = 100;

interface MealSchedule {
  id: string;
  name: string;
  time: string;
  notify: boolean;
}

const DEFAULT_MEALS: MealSchedule[] = [
  { id: '1', name: 'เช้า', time: '08:30', notify: true },
  { id: '2', name: 'กลางวัน', time: '12:30', notify: true },
  { id: '3', name: 'เย็น', time: '18:30', notify: true },
];

const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const getTimePeriod = (value: string) => {
  if (!isValidTime(value)) return 'กรุณากรอกเวลาในรูปแบบ HH:MM';

  const hours = Number(value.slice(0, 2));
  if (hours < 5 || hours >= 19) return 'ตอนกลางคืน';
  if (hours < 11) return 'ตอนเช้า';
  if (hours < 13) return 'ตอนกลางวัน';
  if (hours < 16) return 'ตอนบ่าย';
  return 'ตอนเย็น';
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const getMealOrderViolation = (mealList: MealSchedule[]) => {
  for (let index = 1; index < mealList.length; index += 1) {
    const previousMeal = mealList[index - 1];
    const currentMeal = mealList[index];

    if (
      isValidTime(previousMeal.time) &&
      isValidTime(currentMeal.time) &&
      timeToMinutes(currentMeal.time) <= timeToMinutes(previousMeal.time)
    ) {
      return { previousMeal, currentMeal };
    }
  }
  return null;
};

const getNextMealTime = (meal: MealSchedule | undefined) => {
  if (!meal || !isValidTime(meal.time)) return null;

  const nextMinutes = timeToMinutes(meal.time) + 60;
  if (nextMinutes >= 24 * 60) return null;

  const hours = Math.floor(nextMinutes / 60).toString().padStart(2, '0');
  const minutes = (nextMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getWaterTargetStepCount = (minimum: number, maximum: number) =>
  Math.ceil((maximum - minimum) / WATER_STEP_ML);

const getWaterTargetAtStep = (stepIndex: number, minimum: number, maximum: number) => {
  const finalStep = getWaterTargetStepCount(minimum, maximum);
  const boundedStep = Math.min(finalStep, Math.max(0, stepIndex));
  return boundedStep === finalStep
    ? maximum
    : minimum + boundedStep * WATER_STEP_ML;
};

const getWaterTargetFromProgress = (progress: number, minimum: number, maximum: number) => {
  const range = maximum - minimum;
  const rawTarget = minimum + progress * range;
  const lastRegularStep = Math.floor(range / WATER_STEP_ML);
  const lastRegularTarget = minimum + lastRegularStep * WATER_STEP_ML;
  const regularTarget = Math.min(
    lastRegularTarget,
    minimum + Math.round((rawTarget - minimum) / WATER_STEP_ML) * WATER_STEP_ML
  );

  if (
    lastRegularTarget < maximum &&
    rawTarget >= (lastRegularTarget + maximum) / 2
  ) {
    return maximum;
  }

  return regularTarget;
};

export default function ManageMealWaterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [meals, setMeals] = useState<MealSchedule[]>([]);
  const [waterTarget, setWaterTarget] = useState(2000);

  const waterSliderWidth = useRef(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const hourListRef = useRef<ScrollView>(null);
  const minuteListRef = useRef<ScrollView>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success'
  });
  const mealOrderViolation = getMealOrderViolation(meals);
  const waterRange = useMemo(
    () => getWaterTargetRange(Number(userData?.weight_kg || 0)),
    [userData?.weight_kg]
  );

  useEffect(() => { loadUserSettings(); }, []);

  useEffect(() => {
    if (!showTimePicker) return;
    hourListRef.current?.scrollTo({ y: Math.max(0, selectedHour * 36 - 92), animated: false });
    minuteListRef.current?.scrollTo({ y: Math.max(0, selectedMinute * 36 - 92), animated: false });
  }, [showTimePicker, selectedHour, selectedMinute]);

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
        if (Array.isArray(data.meal_settings?.schedules) && data.meal_settings.schedules.length > 0) {
          setMeals(data.meal_settings.schedules.map((m: any, i: number) => ({
            id: m.id || String(i + Date.now()),
            name: m.name,
            time: m.time,
            notify: m.notify ?? true
          })));
        } else {
          setMeals(DEFAULT_MEALS);
        }

        // โหลดเป้าหมายน้ำ
        const range = getWaterTargetRange(Number(data.weight_kg || 0));
        const savedWaterTarget = data.water_target_ml == null
          ? range.minimum
          : Number(data.water_target_ml);
        const boundedWaterTarget = Number.isFinite(savedWaterTarget)
          ? Math.min(range.maximum, Math.max(range.minimum, savedWaterTarget))
          : range.minimum;
        const progress = range.maximum === range.minimum
          ? 0
          : (boundedWaterTarget - range.minimum) / (range.maximum - range.minimum);
        setWaterTarget(getWaterTargetFromProgress(progress, range.minimum, range.maximum));
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // 💡 ระบบคำนวณปริมาณน้ำแนะนำ (สูตร: น้ำหนักตัว x 33)
  const recommendedWater = useMemo(() => {
    return waterRange.minimum;
  }, [waterRange]);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const handleUpdateMeal = (id: string, key: keyof MealSchedule, value: any) => {
    setMeals(previous => previous.map(meal => meal.id === id ? { ...meal, [key]: value } : meal));
  };

  const getMealTimeBounds = (mealId: string) => {
    const index = meals.findIndex(meal => meal.id === mealId);
    if (index < 0) return { minimum: undefined, maximum: undefined };

    const previousMeal = meals[index - 1];
    const nextMeal = meals[index + 1];
    const previousMinutes = previousMeal && isValidTime(previousMeal.time)
      ? timeToMinutes(previousMeal.time)
      : undefined;
    const nextMinutes = nextMeal && isValidTime(nextMeal.time)
      ? timeToMinutes(nextMeal.time)
      : undefined;

    return {
      minimum: previousMinutes === undefined ? undefined : previousMinutes + 1,
      maximum: nextMinutes === undefined ? undefined : nextMinutes - 1,
    };
  };

  const canSetMealTime = (mealId: string, time: string) => {
    if (!isValidTime(time)) return false;
    const { minimum, maximum } = getMealTimeBounds(mealId);
    const selectedMinutes = timeToMinutes(time);
    return (
      (minimum === undefined || selectedMinutes >= minimum) &&
      (maximum === undefined || selectedMinutes <= maximum)
    );
  };

  const isTimeSelectable = (mealId: string, hour: number, minute: number) =>
    canSetMealTime(mealId, `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);

  const handleRemoveMeal = (id: string) => {
    if (meals.length <= 1) {
      showNotification('ต้องมีมื้ออาหารอย่างน้อย 1 มื้อ', 'error');
      return;
    }
    setMeals(previous => previous.filter(meal => meal.id !== id));
  };

  const handleAddMeal = () => {
    if (meals.length >= 6) {
      showNotification('เพิ่มมื้ออาหารได้สูงสุด 6 มื้อต่อวัน', 'error');
      return;
    }

    const nextTime = getNextMealTime(meals[meals.length - 1]);
    if (!nextTime) {
      showNotification(
        'ไม่สามารถเพิ่มมื้อถัดไปได้ กรุณาปรับเวลามื้อก่อนหน้าให้เร็วกว่า 23:00 น.',
        'error'
      );
      return;
    }

    setMeals(previous => [
      ...previous,
      {
        id: `${Date.now()}-${previous.length}`,
        name: `มื้อที่ ${previous.length + 1}`,
        time: nextTime,
        notify: true,
      },
    ]);
  };

  const openTimePicker = (meal: MealSchedule) => {
    const { minimum, maximum } = getMealTimeBounds(meal.id);
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      showNotification(
        `ไม่มีช่วงเวลาให้ ${meal.name} ระหว่างมื้อก่อนหน้าและมื้อถัดไป กรุณาปรับเวลาอีกมื้อก่อน`,
        'error'
      );
      return;
    }
    const mealMinutes = isValidTime(meal.time) ? timeToMinutes(meal.time) : 12 * 60;
    const minMinutes = minimum ?? 0;
    const maxMinutes = maximum ?? 23 * 60 + 59;
    const initialMinutes = Math.min(maxMinutes, Math.max(minMinutes, mealMinutes));
    setSelectedHour(Math.floor(initialMinutes / 60));
    setSelectedMinute(initialMinutes % 60);
    setActiveMealId(meal.id);
    setShowTimePicker(true);
  };

  const selectHour = (hour: number) => {
    if (!activeMealId) return;
    const validMinutes = Array.from({ length: 60 }, (_, minute) => minute)
      .filter(minute => isTimeSelectable(activeMealId, hour, minute));
    if (validMinutes.length === 0) return;
    setSelectedHour(hour);
    if (!validMinutes.includes(selectedMinute)) {
      setSelectedMinute(validMinutes.reduce((closest, minute) =>
        Math.abs(minute - selectedMinute) < Math.abs(closest - selectedMinute) ? minute : closest
      ));
    }
  };

  const confirmSelectedTime = () => {
    if (!activeMealId) return;
    if (!isTimeSelectable(activeMealId, selectedHour, selectedMinute)) {
      showNotification('เลือกเวลาไม่ได้ ต้องอยู่หลังมื้อก่อนหน้าและก่อนมื้อถัดไป', 'error');
      return;
    }
    handleUpdateMeal(
      activeMealId,
      'time',
      `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
    );
    setShowTimePicker(false);
    setActiveMealId(null);
  };

  const updateWaterTargetFromSlider = (locationX: number) => {
    if (waterSliderWidth.current <= 0) return;
    const progress = Math.min(1, Math.max(0, locationX / waterSliderWidth.current));
    setWaterTarget(
      getWaterTargetFromProgress(progress, waterRange.minimum, waterRange.maximum)
    );
  };

  const handleSaveAll = async () => {
    if (meals.length === 0) {
      showNotification('ต้องมีมื้ออาหารอย่างน้อย 1 มื้อ', 'error');
      return;
    }
    if (meals.length > 6) {
      showNotification('กำหนดมื้ออาหารได้สูงสุด 6 มื้อต่อวัน', 'error');
      return;
    }
    if (meals.some(meal => !isValidTime(meal.time))) {
      showNotification('กรุณาตรวจสอบเวลาให้อยู่ในรูปแบบ 24 ชั่วโมง HH:MM เช่น 08:30', 'error');
      return;
    }
    if (mealOrderViolation) {
      showNotification(
        `${mealOrderViolation.currentMeal.name} (${mealOrderViolation.currentMeal.time} น.) ต้องเริ่มหลัง ${mealOrderViolation.previousMeal.name} (${mealOrderViolation.previousMeal.time} น.)`,
        'error'
      );
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
          water_target_ml: waterTarget
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "ไม่สามารถบันทึกการตั้งค่าได้");
      }
      try {
        const notificationResult = await scheduleMealNotifications(meals);
        if (!notificationResult.ok && notificationResult.reason === 'permission_denied') {
          showNotification('บันทึกข้อมูลแล้ว แต่ยังไม่ได้รับสิทธิ์แจ้งเตือนในเครื่อง', 'error');
          setTimeout(() => router.back(), 2500);
          return;
        }
      } catch (notificationError) {
        console.error('Failed to update meal notifications:', notificationError);
        showNotification('บันทึกข้อมูลแล้ว แต่ปรับการแจ้งเตือนในเครื่องไม่สำเร็จ', 'error');
        return;
      }
      showNotification("🎉 บันทึกการตั้งค่าใหม่เรียบร้อยแล้ว", "success");
      setTimeout(() => router.back(), 1200);
    } catch (e: any) {
      showNotification(e?.message || "เกิดข้อผิดพลาด", "error");
    }
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
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemoveMeal(meal.id)}>
                  <Ionicons name="trash" size={18} color={ERROR_RED} />
                </TouchableOpacity>
              </View>

              <View style={styles.mealControlRow}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => openTimePicker(meal)}>
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
              <Text style={{ fontFamily: 'NotoSansThai', fontSize: 12, color: '#777', marginTop: 4 }}>
                {isValidTime(meal.time)
                  ? `${meal.time} น. · ${getTimePeriod(meal.time)}`
                  : getTimePeriod(meal.time)}
              </Text>
            </View>
          ))}

          {mealOrderViolation && (
            <Text style={styles.warningText}>
              {mealOrderViolation.currentMeal.name} ต้องเริ่มหลัง {mealOrderViolation.previousMeal.name}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.addMealBtn, meals.length >= 6 && { opacity: 0.5 }]}
            onPress={handleAddMeal}
            disabled={meals.length >= 6}
          >
            <Ionicons name="add-circle" size={22} color={ORANGE} />
            <Text style={styles.addMealBtnText}>เพิ่มมื้ออาหาร</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 2: น้ำดื่ม */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💧 เป้าหมายการดื่มน้ำ</Text>
          <Text style={{ fontFamily: 'NotoSansThaiBold', color: '#666', textAlign: 'center', marginTop: 12 }}>
            เป้าหมายของคุณต่อวัน
          </Text>
          <Text style={{ fontFamily: 'NotoSansThaiBold', color: '#222', fontSize: 32, textAlign: 'center', marginTop: 4 }}>
            {waterTarget.toLocaleString()} <Text style={{ fontSize: 17, color: '#777' }}>มล.</Text>
          </Text>
          <Text style={{ fontFamily: 'NotoSansThai', color: '#667085', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
            เลือกได้ตั้งแต่ {waterRange.minimum.toLocaleString()}–{waterRange.maximum.toLocaleString()} มล. ต่อวัน
          </Text>
          {waterRange.isCapped && (
            <Text style={styles.warningText}>
              ระบบจำกัดเป้าหมายไว้ไม่เกิน 4,000 ml ซึ่งเป็นขีดจำกัดของแอป
              ไม่ใช่ปริมาณที่เหมาะกับทุกคน การดื่มน้ำมากเกินไปในเวลาสั้นอาจเป็นอันตรายได้
              หากเป็นนักกีฬาหรือออกกำลังกายหนักเป็นพิเศษ ควรปรึกษาแพทย์
              เพื่อปรับปริมาณน้ำดื่มที่เหมาะสม
            </Text>
          )}
          <View
            style={{ width: '100%', height: 32, justifyContent: 'center', marginTop: 10, touchAction: 'none' }}
            onLayout={(event) => {
              waterSliderWidth.current = event.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => !saving}
            onMoveShouldSetResponder={() => !saving}
            onResponderGrant={(event) => updateWaterTargetFromSlider(event.nativeEvent.locationX)}
            onResponderMove={(event) => updateWaterTargetFromSlider(event.nativeEvent.locationX)}
            accessibilityRole="adjustable"
            accessibilityLabel="เป้าหมายการดื่มน้ำต่อวัน"
            accessibilityValue={{
              min: waterRange.minimum,
              max: waterRange.maximum,
              now: waterTarget,
            }}
            accessibilityActions={[
              { name: 'decrement', label: 'ลดเป้าหมาย 100 มิลลิลิตร' },
              { name: 'increment', label: 'เพิ่มเป้าหมาย 100 มิลลิลิตร' },
            ]}
            onAccessibilityAction={(event) => {
              const stepDelta = event.nativeEvent.actionName === 'increment' ? 1 : -1;
              const stepIndex = waterTarget >= waterRange.maximum
                ? getWaterTargetStepCount(waterRange.minimum, waterRange.maximum)
                : Math.round((waterTarget - waterRange.minimum) / WATER_STEP_ML);
              setWaterTarget(
                getWaterTargetAtStep(
                  stepIndex + stepDelta,
                  waterRange.minimum,
                  waterRange.maximum
                )
              );
            }}
          >
            <View style={{ position: 'absolute', left: 0, right: 0, height: 7, borderRadius: 4, backgroundColor: '#DCE5F3' }} />
            <View
              style={{
                position: 'absolute',
                left: 0,
                height: 7,
                borderRadius: 4,
                backgroundColor: '#168FE5',
                width: `${waterRange.maximum === waterRange.minimum ? 0 : ((waterTarget - waterRange.minimum) / (waterRange.maximum - waterRange.minimum)) * 100}%`,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                marginLeft: -12,
                borderWidth: 3,
                borderRadius: 12,
                borderColor: '#FFF',
                backgroundColor: '#168FE5',
                left: `${waterRange.maximum === waterRange.minimum ? 0 : ((waterTarget - waterRange.minimum) / (waterRange.maximum - waterRange.minimum)) * 100}%`,
                elevation: 3,
              }}
            />
          </View>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'NotoSansThai', color: '#667085', fontSize: 11 }}>{waterRange.minimum.toLocaleString()} ml</Text>
            <Text style={{ fontFamily: 'NotoSansThai', color: '#8A94A3', fontSize: 11 }}>ปรับทีละ 100 ml</Text>
            <Text style={{ fontFamily: 'NotoSansThai', color: '#667085', fontSize: 11 }}>{waterRange.maximum.toLocaleString()} ml</Text>
          </View>
          <TouchableOpacity
            style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EAF5FF' }}
            onPress={() => setWaterTarget(recommendedWater)}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#1678C2', fontFamily: 'NotoSansThaiBold', fontSize: 13 }}>ใช้ค่าที่แนะนำ</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} disabled={saving}>
          {saving ? <ActivityIndicator color="white"/> : <Text style={styles.saveButtonText}>บันทึกข้อมูลทั้งหมด</Text>}
        </TouchableOpacity>

      </ScrollView>

      <Modal
        visible={showTimePicker && activeMealId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, width: '100%', maxWidth: 260, alignSelf: 'center' }}>
            <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 17, textAlign: 'center', marginBottom: 12 }}>
              เลือกเวลา{meals.find(meal => meal.id === activeMealId)?.name ? ` · ${meals.find(meal => meal.id === activeMealId)?.name}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              {[{ label: 'ชั่วโมง', values: Array.from({ length: 24 }, (_, value) => value) },
                { label: 'นาที', values: Array.from({ length: 60 }, (_, value) => value) }].map(column => (
                <View key={column.label}                                 style={{ width: 64, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'NotoSansThai', color: '#777', marginBottom: 6 }}>{column.label}</Text>
                  <ScrollView
                    ref={column.label === 'ชั่วโมง' ? hourListRef : minuteListRef}
                    style={{ height: 180 }}
                    contentContainerStyle={{ alignItems: 'center' }}
                    showsVerticalScrollIndicator
                  >
                    {column.values.map(value => {
                      const enabled = activeMealId !== null && (
                        column.label === 'ชั่วโมง'
                          ? Array.from({ length: 60 }, (_, minute) => minute)
                              .some(minute => isTimeSelectable(activeMealId, value, minute))
                          : isTimeSelectable(activeMealId, selectedHour, value)
                      );
                      const selected = column.label === 'ชั่วโมง' ? selectedHour === value : selectedMinute === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          disabled={!enabled}
                          onPress={() => column.label === 'ชั่วโมง' ? selectHour(value) : setSelectedMinute(value)}
                          style={{ width: 56, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: selected ? '#FFF2D9' : 'transparent' }}
                        >
                          <Text style={{
                            fontFamily: selected ? 'NotoSansThaiBold' : 'NotoSansThai',
                            fontSize: 16,
                            color: !enabled ? '#D3D3D3' : selected ? ORANGE : '#333',
                          }}>
                            {String(value).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} accessibilityRole="button">
                <Text style={{ padding: 10, color: '#666' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSelectedTime} accessibilityRole="button">
                <Text style={{ padding: 10, color: ORANGE, fontFamily: 'NotoSansThaiBold' }}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}