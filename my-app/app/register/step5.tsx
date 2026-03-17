import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, BG, IOS_GREEN, ROW_COLOR_1, ROW_COLOR_2, WHITE } from "./step5.styles";


// อัปเดต Type ให้ตรงกับ Context ของคุณ
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active" ;

const activityOptions: { label: string; value: ActivityLevel; desc: string; }[] = [
  { label: "น้อย", value: "light", desc: "นั่งทำงานเป็นส่วนใหญ่ หรือออกกำลังกายน้อยมาก" },
  { label: "ปานกลาง", value: "moderate", desc: "มีการเดินหรือออกกำลังกายเบา ๆ 2-3 วันต่อสัปดาห์" },
  { label: "มาก", value: "active", desc: "ออกกำลังกายสม่ำเสมอ หรือใช้ร่างกายค่อนข้างมาก" },
  { label: "หนัก", value: "very_active", desc: "ออกกำลังกายหนักหรือใช้แรงงานเป็นประจำเกือบทุกวัน" },
];

export default function RegisterStep5Screen() {
  const { form, updateForm } = useRegister();
const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>(() => {
    const savedLevel = form.activityLevel as string;
    // ดักจับค่าเก่าที่อาจตกค้าง แล้วแปลงเป็นค่าใหม่
    if (savedLevel === "low") return "light";
    if (savedLevel === "medium") return "moderate";
    if (savedLevel === "high") return "active";
    if (savedLevel === "very_high") return "very_active";
    
    // ถ้าเป็นค่าที่ถูกต้องอยู่แล้ว หรือไม่มีค่า ให้ใช้ "moderate" เป็นค่าเริ่มต้น
    return (savedLevel as ActivityLevel) || "moderate";
  });
  const [showActivityModal, setShowActivityModal] = useState(false);

const handleNext = () => {
    updateForm({ activityLevel: selectedActivity });
    router.push("/register/step5-1" as any); // (ส่วน router.push ปล่อย as any ไว้ได้ครับ ไม่มีผลกับ DB)
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>5. ระดับกิจกรรมต่อวัน</Text>

        <View style={styles.progressTrack}>
          {/* ขยับหลอดให้เป็นสัก 50% */}
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>

        <Text style={styles.sectionDesc}>
          ใช้เพื่อช่วยประเมินการใช้พลังงานของร่างกายในการจัดตารางอาหาร
        </Text>

        <View style={styles.optionList}>
          {activityOptions.map((item) => {
            const active = selectedActivity === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setSelectedActivity(item.value)}
                activeOpacity={0.85}
              >
                <View style={styles.optionTopRow}>
                  <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                    {item.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </View>
                <Text style={[styles.optionDesc, active && styles.optionDescActive]}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.helpButtonWrap}>
          <TouchableOpacity style={styles.helperButton} onPress={() => setShowActivityModal(true)}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.helperButtonText}>คำอธิบายเพิ่มเติม</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal คำอธิบายกิจกรรม */}
      <Modal visible={showActivityModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>ระดับกิจกรรม</Text>
            {activityOptions.map((item) => (
              <View key={item.value} style={styles.modalItem}>
                <Text style={styles.modalItemTitle}>{item.label}</Text>
                <Text style={styles.modalItemDesc}>{item.desc}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowActivityModal(false)}>
              <Text style={styles.modalCloseText}>เข้าใจแล้ว</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

