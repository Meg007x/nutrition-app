import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

const mockWeightKg = 66;

const activityOptions = [
  { key: "low", title: "น้อย", subtitle: "เดินน้อย ทำงานนั่ง" },
  { key: "medium", title: "ปานกลาง", subtitle: "เดินบ้าง" },
  { key: "high", title: "มาก", subtitle: "ขยับเยอะ" },
  { key: "heavy", title: "หนัก", subtitle: "ทำกิจกรรมหนัก" },
];

export default function RegisterStep5Screen() {
  const [activity, setActivity] = useState("medium");
  const [manualProtein, setManualProtein] = useState("");
  const [showActivityInfo, setShowActivityInfo] = useState(false);
  const [showProteinInfo, setShowProteinInfo] = useState(false);

  const aiProtein = useMemo(() => {
    let multiplier = 1.6;

    if (activity === "low") multiplier = 1.2;
    if (activity === "medium") multiplier = 1.6;
    if (activity === "high") multiplier = 1.8;
    if (activity === "heavy") multiplier = 2.0;

    return Math.round(mockWeightKg * multiplier);
  }, [activity]);

  const parsedProtein = useMemo(() => {
    const n = parseFloat(manualProtein);
    return Number.isFinite(n) ? n : 0;
  }, [manualProtein]);

  const increaseProtein = () => {
    Keyboard.dismiss();
    const next = Math.min(400, parsedProtein + 1);
    setManualProtein(String(next));
  };

  const decreaseProtein = () => {
    Keyboard.dismiss();
    const next = Math.max(0, parsedProtein - 1);
    setManualProtein(String(next));
  };

  const handleChangeProtein = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setManualProtein(cleaned);
  };

  const goNext = () => {
    router.push("/register/step6");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>5.ระดับกิจกรรมและโปรตีน</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.sectionTitle}>
            ระดับกิจกรรมในชีวิตประจำวัน
          </Text>

          <View style={styles.activityGrid}>
            {activityOptions.map((item) => {
              const active = activity === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.activityButton,
                    active && styles.activityButtonActive,
                  ]}
                  onPress={() => setActivity(item.key)}
                >
                  <Text
                    style={[
                      styles.activityTitle,
                      active && styles.activityTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowActivityInfo(true)}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="alert-circle-outline" size={26} color="#111" />
              <Text style={styles.infoText}>
                ระดับกิจกรรมในชีวิตประจำวันคืออะไร
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#111" />
          </TouchableOpacity>

          <Text style={styles.proteinTitle}>
            เป้าหมายโปรตีนที่ต้องการ/วัน (กรัม)
          </Text>

          <View style={styles.aiBox}>
            <Text style={styles.aiTitle}>ให้ AI คำนวณให้ (แนะนำ)</Text>

            <Text style={styles.aiSubtitle}>
              ระบบจะคำนวณจาก น้ำหนัก + ระดับกิจกรรม + เป้าหมาย
            </Text>

            <View style={styles.aiValueRow}>
              <Text style={styles.aiValue}>{aiProtein}</Text>
              <Text style={styles.aiUnit}>กรัม/วัน</Text>
            </View>
          </View>

          <Text style={styles.manualTitle}>กำหนดเอง</Text>

          <Text style={styles.manualSubtitle}>
            หากคุณมีตารางจากเทรนเนอร์ส่วนตัว
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={manualProtein}
              onChangeText={handleChangeProtein}
              keyboardType="number-pad"
              placeholder="ระบุตัวเลข (กรัม)"
            />

            <View style={styles.arrowWrap}>
              <TouchableOpacity onPress={increaseProtein}>
                <Ionicons name="chevron-up" size={18} color="#555" />
              </TouchableOpacity>

              <TouchableOpacity onPress={decreaseProtein}>
                <Ionicons name="chevron-down" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.unitText}>กรัม/วัน</Text>
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowProteinInfo(true)}
          >
            <View style={styles.infoLeft}>
              <Ionicons name="alert-circle-outline" size={26} color="#111" />
              <Text style={styles.infoText}>เป้าหมายโปรตีนคืออะไร</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#111" />
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={goNext}>
              <Text style={styles.nextText}>ถัดไป</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Activity Info Modal */}

        <Modal visible={showActivityInfo} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowActivityInfo(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>ระดับกิจกรรมคืออะไร</Text>

              <Text style={styles.modalText}>
                น้อย = เดินน้อย ทำงานนั่ง{"\n"}
                ปานกลาง = เดินบ้างในชีวิตประจำวัน{"\n"}
                มาก = ขยับตัวเยอะ{"\n"}
                หนัก = ใช้แรงมาก
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowActivityInfo(false)}
              >
                <Text style={styles.modalButtonText}>เข้าใจแล้ว</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Protein Info */}

        <Modal visible={showProteinInfo} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowProteinInfo(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>โปรตีนคืออะไร</Text>

              <Text style={styles.modalText}>
                โปรตีนช่วยซ่อมแซมกล้ามเนื้อ
                และช่วยให้ร่างกายฟื้นตัวหลังออกกำลังกาย
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowProteinInfo(false)}
              >
                <Text style={styles.modalButtonText}>เข้าใจแล้ว</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    alignItems: "center",
  },

  headerText: { color: "#fff", fontSize: 20, fontWeight: "900" },

  scroll: { flex: 1 },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  stepTitle: { fontSize: 26, fontWeight: "900" },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },

  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: ORANGE,
  },

  sectionTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "900",
  },

  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },

  activityButton: {
    width: "31%",
    backgroundColor: "#EA8D20",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  activityButtonActive: {
    borderWidth: 2,
    borderColor: "#B65E00",
  },

  activityTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },

  activityTitleActive: {},

  activitySubtitle: { color: "#fff", fontSize: 12 },

  infoRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoLeft: { flexDirection: "row", alignItems: "center" },

  infoText: { marginLeft: 8, fontSize: 16, color: "#666" },

  proteinTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
  },

  aiBox: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },

  aiTitle: { fontWeight: "900", fontSize: 18 },

  aiSubtitle: { color: "#777", marginTop: 4 },

  aiValueRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  aiValue: { fontSize: 36, color: "#F08A00", fontWeight: "900" },

  aiUnit: { marginLeft: 6, fontSize: 16 },

  manualTitle: { marginTop: 16, fontSize: 18, fontWeight: "900" },

  manualSubtitle: { color: "#777", marginTop: 2 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 10,
    height: 50,
  },

  input: { flex: 1, fontSize: 16 },

  arrowWrap: { marginHorizontal: 6 },

  unitText: { fontSize: 14 },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },

  backButton: {
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  backText: { fontWeight: "900" },

  nextButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  nextText: { color: "#fff", fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: { fontSize: 20, fontWeight: "900", textAlign: "center" },

  modalText: { marginTop: 10, fontSize: 16, lineHeight: 24 },

  modalButton: {
    marginTop: 18,
    backgroundColor: ORANGE,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtonText: { color: "#fff", fontWeight: "900" },
});