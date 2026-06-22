import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  Modal, 
  Pressable, 
  ActivityIndicator, 
  Alert,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { styles, ORANGE } from '@/style/updateGoal.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const weekOptions = [
  "1 สัปดาห์", "2 สัปดาห์", "3 สัปดาห์", "4 สัปดาห์",
  "6 สัปดาห์", "8 สัปดาห์", "10 สัปดาห์", "12 สัปดาห์"
] as const;

// แมปค่าภาษาไทยในฐานข้อมูลกับระบบหน้าบ้านให้เข้าใจตรงกัน
type GoalType = 'ลดน้ำหนัก' | 'รักษารูปร่าง' | 'เพิ่มกล้ามเนื้อ';

export default function UpdateGoalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  // 🎯 States บันทึกค่าที่ทำงานบนฟอร์มปัจจุบัน
  const [selectedGoal, setSelectedGoal] = useState<GoalType>('รักษารูปร่าง');
  const [targetWeight, setTargetWeight] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('4 สัปดาห์');
  const [showWeekModal, setShowWeekModal] = useState(false);

  // 🎯 UCD States: ใช้จดจำ "ค่าเดิมจากฐานข้อมูล" เพื่อนำมาสลับคืนเมื่อกรอกช่องว่างเปล่า
  const [originalWeight, setOriginalWeight] = useState('');

  useEffect(() => {
    loadUserGoalData();
  }, []);

  // 🟢 ฟังก์ชันดึงข้อมูลจากหลังบ้านมากางเป็น "ค่าแรกสุด" ในแต่ละช่องตามหลัก UCD
  const loadUserGoalData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) {
        setLoading(false);
        return;
      }
      const userObj = JSON.parse(userJson);
      const userId = userObj.user_id || userObj.id || userObj._id;
      setCurrentUserId(userId);

      // ยิงไปดึงข้อมูลโปรไฟล์ล่าสุดมาเช็ค
      const response = await fetch(`http://localhost:3000/api/users/profile?userId=${userId}`);
      const json = await response.json();

      if (json.success && json.data && json.data.health_goals) {
        const goals = json.data.health_goals;
        
        // 1. ดึงเป้าหมายหลักตรงตามคีย์ DB 
        if (goals.primary_goal) {
          setSelectedGoal(goals.primary_goal as GoalType);
        }

        // 2. ดึงเป้าหมายน้ำหนักที่ต้องการกรอกคาไว้เป็นค่าแรกสุด
        const savedWeight = goals.target_weight_kg ? goals.target_weight_kg.toString() : '';
        setTargetWeight(savedWeight);
        setOriginalWeight(savedWeight); // ล็อกจดจำประวัติไว้

        // 3. ดึงระยะเวลาจำนวนสัปดาห์
        if (goals.duration_weeks) {
          setSelectedWeek(`${goals.duration_weeks} สัปดาห์`);
        }
      }
    } catch (error) {
      console.error("❌ Error loading health goals:", error);
    } finally {
      setLoading(false);
    }
  };

const handleSaveGoal = async () => {
    console.log("=== เริ่มต้นกระบวนการบันทึกข้อมูล ===");

    // 1. ล้างโฟกัสบนเว็บ ป้องกันปัญหาหน้าจอรวน
    Keyboard.dismiss();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }

    // 2. เช็กว่ามี userId ไหม
    if (!currentUserId) {
      alert("ไม่พบรหัสผู้ใช้งาน (userId เป็นค่าว่าง) กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      return;
    }

    // 3. เช็กว่ากรอกน้ำหนักหรือยัง (ถ้าไม่ใช่รักษารูปร่าง)
    if (selectedGoal !== 'รักษารูปร่าง' && !targetWeight) {
      alert("กรุณาระบุน้ำหนักเป้าหมายที่ต้องการ");
      return;
    }

    setSaving(true);
    
    // แปลง "4 สัปดาห์" ให้เหลือแค่ตัวเลข 4
    const weeksNumber = parseInt(selectedWeek.replace(/[^0-9]/g, '')) || 4;
    
    // แปลงน้ำหนักเป็นตัวเลข หากเลือกรักษารูปร่างให้ส่งเป็นน้ำหนักเดิม หรือส่งเลขที่หลังบ้านต้องการ (ลองส่ง parseFloat ดู)
    const weightToSend = selectedGoal === 'รักษารูปร่าง' ? parseFloat(originalWeight) || 0 : parseFloat(targetWeight);

    // สร้างก้อนข้อมูลที่จะส่งไปให้คุณเห็นใน Console ก่อนส่งจริง
    const payload = {
      userId: currentUserId,
      primary_goal: selectedGoal,
      target_weight_kg: weightToSend,
      duration_weeks: weeksNumber
    };
    console.log("📦 กำลังส่งข้อมูลไปหลังบ้าน:", payload);

    try {
      const response = await fetch('http://localhost:3000/api/users/update-goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      console.log("📩 ผลลัพธ์ที่หลังบ้านตอบกลับมา:", json);

      if (response.ok && json.success) {
        // บันทึกสำเร็จ
        alert("🎉 ปรับเปลี่ยนแผนเป้าหมายสุขภาพเรียบร้อยแล้ว");
        
        // ย้อนกลับหน้าเดิมอย่างปลอดภัย
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/'); // ถ้าไม่มีหน้าให้ย้อนกลับ ส่งไปหน้าแรกสุด
        }
      } else {
        // 💥 ดักจับกรณีพัง (400 Bad Request) แล้วเอาข้อความจากหลังบ้านมาโชว์
        alert(`❌ บันทึกไม่สำเร็จ (โค้ด ${response.status}): ` + (json.message || "ข้อมูลไม่ถูกต้องตามที่เซิร์ฟเวอร์ต้องการ"));
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดทางระบบ:", error);
      alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์พอร์ต 3000 ได้");
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
    // 🟢 1. ถอด TouchableWithoutFeedback ออก ให้ SafeAreaView เป็นตัวคลุมบนสุดตามปกติ
    <SafeAreaView style={styles.container}>
      {/* แถบหัวข้อด้านบนสุด */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>ปรับเปลี่ยนเป้าหมายสุขภาพ</ThemedText>
      </View>

      {/* 🟢 2. เพิ่ม keyboardShouldPersistTaps="handled" เข้าไปใน ScrollView */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={styles.sectionTitle}>เป้าหมายในปัจจุบันของคุณคืออะไร?</ThemedText>

        {/* การ์ดเลือกเป้าหมาย: ลดน้ำหนัก */}
        <TouchableOpacity 
          style={[styles.goalCard, selectedGoal === 'ลดน้ำหนัก' && styles.goalCardActive]}
          onPress={() => setSelectedGoal('ลดน้ำหนัก')}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FFEBEE' }]}>
            <MaterialCommunityIcons name="trending-down" size={26} color="#E53935" />
          </View>
          <View style={styles.goalInfo}>
            <ThemedText style={styles.goalLabel}>ลดน้ำหนัก</ThemedText>
            <ThemedText style={styles.goalSub}>เบิร์นไขมันส่วนเกินและควบคุมพลังงานรายวัน</ThemedText>
          </View>
          {selectedGoal === 'ลดน้ำหนัก' && <Ionicons name="checkmark-circle" size={24} color={ORANGE} />}
        </TouchableOpacity>

        {/* การ์ดเลือกเป้าหมาย: รักษารูปร่าง */}
        <TouchableOpacity 
          style={[styles.goalCard, selectedGoal === 'รักษารูปร่าง' && styles.goalCardActive]}
          onPress={() => setSelectedGoal('รักษารูปร่าง')}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="scale-balance" size={26} color="#43A047" />
          </View>
          <View style={styles.goalInfo}>
            <ThemedText style={styles.goalLabel}>รักษารูปร่าง</ThemedText>
            <ThemedText style={styles.goalSub}>เน้นความสมดุล รักษาน้ำหนักและสุขภาพที่คงที่</ThemedText>
          </View>
          {selectedGoal === 'รักษารูปร่าง' && <Ionicons name="checkmark-circle" size={24} color={ORANGE} />}
        </TouchableOpacity>

        {/* การ์ดเลือกเป้าหมาย: เพิ่มกล้ามเนื้อ */}
        <TouchableOpacity 
          style={[styles.goalCard, selectedGoal === 'เพิ่มกล้ามเนื้อ' && styles.goalCardActive]}
          onPress={() => setSelectedGoal('เพิ่มกล้ามเนื้อ')}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="trending-up" size={26} color="#1E88E5" />
          </View>
          <View style={styles.goalInfo}>
            <ThemedText style={styles.goalLabel}>เพิ่มกล้ามเนื้อ</ThemedText>
            <ThemedText style={styles.goalSub}>สร้างมวลกล้ามเนื้อและเสริมสร้างสารอาหารเพิ่ม</ThemedText>
          </View>
          {selectedGoal === 'เพิ่มกล้ามเนื้อ' && <Ionicons name="checkmark-circle" size={24} color={ORANGE} />}
        </TouchableOpacity>

        {/* ช่องกรอกน้ำหนักเป้าหมาย แสดงผลเฉพาะเมื่อไม่ได้เลือกรักษารูปร่าง */}
        {selectedGoal !== 'รักษารูปร่าง' && (
          <View style={styles.subSection}>
            <ThemedText style={styles.subSectionTitle}>น้ำหนักเป้าหมายที่ต้องการ</ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={(text) => {
                      setTargetWeight(text);
                  }}
                  placeholder="กรอกน้ำหนักเป้าหมาย เช่น 75"
                  placeholderTextColor="#A9A9A9"
                  
                  // 🟢 UCD: แตะสัมผัสจิ้มช่องแล้วเคลียร์ตัวหนังสือเดิมออกทันที 
                  onFocus={() => {
                      if (targetWeight === originalWeight) {
                        setTargetWeight('');
                      }
                  }}

                  // 🟢 UCD: เมื่อผู้ใช้ละสายตาหรือกดออกจากช่องพิมพ์ (Blur) ดึงค่าเดิมคืน
                  onBlur={() => {
                      if (!targetWeight || targetWeight.trim() === '') {
                        setTargetWeight(originalWeight);
                      }
                  }}
                />
              <ThemedText style={styles.unitText}>กิโลกรัม</ThemedText>
            </View>
          </View>
        )}

        {/* ช่องเลือกระยะเวลาแผนงาน */}
        <View style={styles.subSection}>
          <ThemedText style={styles.subSectionTitle}>ระยะเวลาในการดำเนินแผนงาน</ThemedText>
          <TouchableOpacity 
            style={[styles.inputRow, styles.dropdownSelector]} 
            onPress={() => setShowWeekModal(true)}
          >
            <ThemedText style={styles.dropdownText}>{selectedWeek}</ThemedText>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 🟢 ปุ่มบันทึกข้อมูลปรับปรุงเพื่อ Web Platform: ใส่ accessible ให้กดติดแน่นอน */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]} 
          onPress={handleSaveGoal} 
          disabled={saving}
          accessible={true}
          accessibilityRole="button"
        >
          {saving ? <ActivityIndicator color="white" /> : <ThemedText style={styles.saveButtonText}>บันทึกเป้าหมายใหม่</ThemedText>}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal เลือกจำนวนสัปดาห์ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWeekModal}
        onRequestClose={() => setShowWeekModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowWeekModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <ThemedText style={styles.modalTitle}>เลือกระยะเวลาแผนงาน</ThemedText>
            
            {weekOptions.map((week) => {
              const active = selectedWeek === week;
              return (
                <TouchableOpacity
                  key={week}
                  style={styles.weekOption}
                  onPress={() => {
                    setSelectedWeek(week);
                    setShowWeekModal(false);
                  }}
                >
                  <ThemedText style={[styles.weekOptionText, active && styles.weekOptionTextActive]}>
                    {week} {active && "(เป้าหมายปัจจุบัน)"}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowWeekModal(false)}>
              <ThemedText style={styles.modalCancelText}>ยกเลิก</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}