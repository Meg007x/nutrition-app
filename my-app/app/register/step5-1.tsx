import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const WHITE = "#FFFFFF";

// สีสำหรับสถานะการแจ้งเตือน
const WARN_COLOR = "#FF9500";
const ERROR_COLOR = "#FF3B30";

type ProteinLevel = "low" | "medium" | "high";
type ProteinMode = "auto" | "custom";

const proteinOptions: { label: string; value: ProteinLevel; desc: string; hint: string; }[] = [
  { label: "พื้นฐาน", value: "low", desc: "เหมาะกับคนทั่วไปที่ดูแลสุขภาพเบาๆ", hint: "ประมาณ 1.2 กรัม / กก." },
  { label: "สมดุล", value: "medium", desc: "เหมาะกับคนที่ออกกำลังกายสม่ำเสมอ", hint: "ประมาณ 1.6 กรัม / กก." },
  { label: "สูง", value: "high", desc: "เน้นสร้างกล้ามเนื้อแบบที่คุณต้องการ", hint: "ประมาณ 2.0-2.4 กรัม / กก." },
];

export default function RegisterStep5_1Screen() {
  const { form, updateForm, calculateRecommendedProtein } = useRegister();
  
  const currentWeight = form.weightKg ? Number(form.weightKg) : 60; // ดึงน้ำหนักมาใช้ประเมิน
  const currentActivity = form.activityLevel || "medium";

  // ฟังก์ชันแนะนำโปรตีนคร่าวๆ ตามกิจกรรม (ปรับให้ตรงกับ Type ของ Context)
  const getRecommendedLevel = (): ProteinLevel => {
    if (currentActivity === "sedentary" || currentActivity === "light") return "low";
    if (currentActivity === "active" || currentActivity === "very_active") return "high";
    return "medium"; // สำหรับ "moderate" หรือ "medium"
  };

  const recommendedLevel = getRecommendedLevel();

  const [selectedProtein, setSelectedProtein] = useState<ProteinLevel>(
    (form.proteinLevel as ProteinLevel) || recommendedLevel
  );
  
  const [proteinMode, setProteinMode] = useState<ProteinMode>(
    form.recommendedProteinG ? "custom" : "auto"
  );

  // คำนวณค่าโปรตีนออโต้ตั้งต้น
  const autoRecommendedProtein = useMemo(() => {
    const result = calculateRecommendedProtein(String(currentWeight), selectedProtein as any);
    return result ?? (currentWeight * 1.6); // Fallback
  }, [calculateRecommendedProtein, currentWeight, selectedProtein]);

  const [customProtein, setCustomProtein] = useState(
    form.recommendedProteinG ? String(form.recommendedProteinG) : String(autoRecommendedProtein)
  );

  // อัปเดตค่า Custom เมื่อสลับโหมด หรือเปลี่ยน Level (เพื่อให้ผู้ใช้เห็นค่าที่แนะนำทันที)
  useEffect(() => {
    if (proteinMode === "auto") {
      setCustomProtein(String(autoRecommendedProtein));
    }
  }, [autoRecommendedProtein, proteinMode]);

  // --- 💡 ระบบวิเคราะห์และดักจับความเหมาะสมของโปรตีน ---
  const validationStatus = useMemo(() => {
    const val = Number(customProtein);
    if (!customProtein || val <= 0) return { status: "error", msg: "กรุณากรอกจำนวนโปรตีน" };
    
    // คำนวณเป็น กรัม/น้ำหนักตัว 1 กก.
    const ratio = val / currentWeight;

    if (ratio < 0.6) return { status: "error", msg: "ปริมาณโปรตีนน้อยเกินไป อาจส่งผลเสียต่อร่างกาย" };
    if (ratio >= 2.5 && ratio < 3.0) return { status: "warn", msg: "ปริมาณค่อนข้างสูงมาก แนะนำสำหรับนักกีฬาเพาะกายเท่านั้น" };
    if (ratio >= 3.0) return { status: "error", msg: `ปริมาณสูงเกินลิมิตความปลอดภัย (> ${Math.round(currentWeight * 3)} กรัม) อาจเป็นอันตรายต่อไต` };
    
    return { status: "normal", msg: "" };
  }, [customProtein, currentWeight]);

  const handleNext = () => {
    Keyboard.dismiss();

    if (proteinMode === "custom" && validationStatus.status === "error") {
      Alert.alert("ไม่สามารถไปต่อได้", validationStatus.msg);
      return;
    }

    const finalVal = proteinMode === "custom" ? Number(customProtein) : autoRecommendedProtein;

    updateForm({
      proteinLevel: selectedProtein as any,
      recommendedProteinG: finalVal,
    });

    // ไป Step ต่อไป (Step 6 หรือตามแผน)
    router.push("/register/step6-1" as any);
  };

  // 📦 รวบหน้าจอไว้ในตัวแปรเดียว เพื่อจัดการเรื่อง Web/Mobile
  const content = (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // <--- ทำให้จิ้มช่องกรอก/ปุ่มได้ราบรื่นขึ้น
      >
        <Text style={styles.stepTitle}>5.1 ปริมาณโปรตีน</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "60%" }]} />
        </View>

        <Text style={styles.sectionDesc}>
          จากข้อมูลของคุณ เราขอแนะนำระดับโปรตีนที่เหมาะสม หรือคุณสามารถปรับเองได้เลย
        </Text>

        {/* สลับโหมดออโต้ / กรอกเอง */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, proteinMode === "auto" && styles.modeButtonActive]}
            onPress={() => setProteinMode("auto")}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeButtonText, proteinMode === "auto" && styles.modeButtonTextActive]}>
              ให้ระบบแนะนำ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, proteinMode === "custom" && styles.modeButtonActive]}
            onPress={() => setProteinMode("custom")}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeButtonText, proteinMode === "custom" && styles.modeButtonTextActive]}>
              ปรับแต่งเอง
            </Text>
          </TouchableOpacity>
        </View>

        {proteinMode === "auto" ? (
          <View style={styles.optionList}>
            {proteinOptions.map((item) => {
              const active = selectedProtein === item.value;
              const isRecommended = recommendedLevel === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setSelectedProtein(item.value)}
                  activeOpacity={0.85}
                >
                  <View style={styles.optionTopRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                        {item.label}
                      </Text>
                      {/* ป้ายแนะนำสำหรับคุณ - ปรับสีให้ตัดและมองเห็นง่ายสุดๆ */}
                      {isRecommended && (
                        <View style={styles.badgeRecommend}>
                          <Text style={styles.badgeRecommendText}>⭐️ แนะนำ</Text>
                        </View>
                      )}
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  </View>
                  <Text style={[styles.optionDesc, active && styles.optionDescActive]}>{item.desc}</Text>
                  <Text style={[styles.optionHint, active && styles.optionHintActive]}>{item.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[
            styles.customCard, 
            validationStatus.status === "error" && { borderColor: ERROR_COLOR },
            validationStatus.status === "warn" && { borderColor: WARN_COLOR }
          ]}>
            <Text style={styles.customTitle}>ระบุโปรตีนที่ต้องการต่อวัน</Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.customInput}
                value={customProtein}
                onChangeText={(text) => setCustomProtein(text.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.customUnit}>กรัม / วัน</Text>
            </View>

            {/* ข้อความแจ้งเตือนสีแดง/ส้ม */}
            {validationStatus.msg ? (
              <Text style={[
                styles.validationMsg, 
                validationStatus.status === "error" ? { color: ERROR_COLOR } : { color: WARN_COLOR }
              ]}>
                {validationStatus.status === "error" ? "🚨 " : "⚠️ "}{validationStatus.msg}
              </Text>
            ) : (
              <Text style={styles.validationMsgNormal}>
                ระบบจะใช้ค่านี้ในการคำนวณอาหารให้คุณโดยเฉพาะ
              </Text>
            )}
          </View>
        )}

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.nextButton, 
              // ซีดปุ่มลงถ้ามี Error
              (proteinMode === "custom" && validationStatus.status === "error") && { backgroundColor: "#ccc", shadowOpacity: 0 }
            ]} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // 🚀 ถ้าเป็นเว็บ ให้คืนค่า content ทันที จะได้ไม่โดนบล็อกการคลิก
  if (Platform.OS === "web") {
    return content;
  }

  // ถ้าเป็นมือถือ ให้ครอบ Touchable แบบเดิม เพื่อให้แตะหุบคีย์บอร์ดได้
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
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
  sectionDesc: { marginTop: 16, fontSize: 16, color: "#555", lineHeight: 24, marginBottom: 12 },
  
  modeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modeButton: { flex: 1, backgroundColor: WHITE, borderWidth: 1.4, borderColor: "#D9D9D9", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modeButtonActive: { backgroundColor: ORANGE, borderColor: "#C97800" },
  modeButtonText: { fontSize: 16, fontWeight: "900", color: "#333" },
  modeButtonTextActive: { color: "#fff" },

  optionList: { gap: 12 },
  optionCard: { backgroundColor: WHITE, borderRadius: 14, borderWidth: 1.4, borderColor: "#D9D9D9", padding: 16 },
  optionCardActive: { backgroundColor: ORANGE, borderColor: "#C97800" },
  optionTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionTitle: { fontSize: 18, fontWeight: "900", color: "#222" },
  optionTitleActive: { color: "#fff" },
  optionDesc: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "#555" },
  optionDescActive: { color: "#FFF7E8" },
  optionHint: { marginTop: 8, fontSize: 14, fontWeight: "800", color: "#7A5A00" },
  optionHintActive: { color: "#fff" },

  // --- ปรับสีป้ายแนะนำให้ตัดกันสุดๆ (สีเขียวมรกต + ตัวหนังสือสีขาว) ---
  badgeRecommend: { backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 10 },
  badgeRecommendText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },

  customCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#D9D9D9", padding: 20, marginTop: 10 },
  customTitle: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F8F8", borderRadius: 12, borderWidth: 1.2, borderColor: "#CCC", paddingHorizontal: 16, height: 60 },
  customInput: { flex: 1, fontSize: 24, fontWeight: "900", color: "#111" },
  customUnit: { fontSize: 16, fontWeight: "800", color: "#666", marginLeft: 10 },
  
  validationMsg: { marginTop: 12, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  validationMsgNormal: { marginTop: 12, fontSize: 14, color: "#666" },

  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  backButton: { width: 120, paddingVertical: 15, borderRadius: 15, borderWidth: 1.8, borderColor: "#333", backgroundColor: "#FFF", alignItems: "center" },
  backButtonText: { fontWeight: "900", fontSize: 16, color: "#111" },
  nextButton: { width: 120, backgroundColor: ORANGE, paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  nextButtonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});