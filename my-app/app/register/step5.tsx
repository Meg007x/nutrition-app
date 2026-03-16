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

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const WHITE = "#FFFFFF";

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerBar: { backgroundColor: ORANGE, paddingVertical: 14, alignItems: "center" },
  headerBarText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, flexGrow: 1 },
  stepTitle: { fontSize: 26, fontWeight: "900", color: "#111" },
  progressTrack: { marginTop: 12, height: 7, backgroundColor: "#D7CFBF", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: ORANGE, borderRadius: 10 },
  sectionDesc: { marginTop: 16, fontSize: 16, color: "#555", lineHeight: 24, marginBottom: 8 },
  optionList: { marginTop: 12, gap: 12 },
  optionCard: { backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.4, borderColor: "#D9D9D9", padding: 16 },
  optionCardActive: { backgroundColor: ORANGE, borderColor: "#C97800" },
  optionTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionTitle: { fontSize: 18, fontWeight: "900", color: "#222" },
  optionTitleActive: { color: "#fff" },
  optionDesc: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "#555" },
  optionDescActive: { color: "#FFF7E8" },
  helpButtonWrap: { marginTop: 12, alignItems: "flex-end" },
  helperButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  helperButtonText: { fontSize: 14, color: "#666", fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  backButton: { width: 120, paddingVertical: 15, borderRadius: 15, borderWidth: 1.8, borderColor: "#333", backgroundColor: "#FFF", alignItems: "center" },
  backButtonText: { fontWeight: "900", fontSize: 16, color: "#111" },
  nextButton: { width: 120, backgroundColor: ORANGE, paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  nextButtonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 20, padding: 22 },
  modalTitle: { fontSize: 22, fontWeight: "900", textAlign: "center", color: "#111", marginBottom: 14 },
  modalItem: { marginBottom: 14 },
  modalItemTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  modalItemDesc: { marginTop: 4, fontSize: 14, color: "#555", lineHeight: 21 },
  modalCloseButton: { marginTop: 16, backgroundColor: ORANGE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});