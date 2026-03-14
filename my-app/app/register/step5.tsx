import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const WHITE = "#FFFFFF";

type ActivityLevel = "low" | "medium" | "high" | "very_high";
type ProteinLevel = "low" | "medium" | "high";
type ProteinMode = "auto" | "custom";

const activityOptions: {
  label: string;
  value: ActivityLevel;
  desc: string;
}[] = [
  {
    label: "น้อย",
    value: "low",
    desc: "นั่งทำงานเป็นส่วนใหญ่ หรือออกกำลังกายน้อยมาก",
  },
  {
    label: "ปานกลาง",
    value: "medium",
    desc: "มีการเดินหรือออกกำลังกายเบา ๆ 2-3 วันต่อสัปดาห์",
  },
  {
    label: "มาก",
    value: "high",
    desc: "ออกกำลังกายสม่ำเสมอ หรือใช้ร่างกายค่อนข้างมาก",
  },
  {
    label: "หนัก",
    value: "very_high",
    desc: "ออกกำลังกายหนักหรือใช้แรงงานเป็นประจำเกือบทุกวัน",
  },
];

const proteinOptions: {
  label: string;
  value: ProteinLevel;
  desc: string;
  hint: string;
}[] = [
  {
    label: "พื้นฐาน",
    value: "low",
    desc: "เหมาะกับคนทั่วไปที่ต้องการดูแลสุขภาพ",
    hint: "ประมาณ 1.2 กรัม / กก.",
  },
  {
    label: "สมดุล",
    value: "medium",
    desc: "เหมาะกับคนที่ออกกำลังกายสม่ำเสมอ",
    hint: "ประมาณ 1.6 กรัม / กก.",
  },
  {
    label: "สูง",
    value: "high",
    desc: "เหมาะกับคนที่เน้นสร้างกล้ามเนื้อหรือควบคุมน้ำหนัก",
    hint: "ประมาณ 2.0 กรัม / กก.",
  },
];

export default function RegisterStep5Screen() {
  const { form, updateForm, calculateRecommendedProtein } = useRegister();

  const currentWeight = form.weightKg ? Number(form.weightKg) : 0;

  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>(
    (form.activityLevel as ActivityLevel) || "medium"
  );

  const [selectedProtein, setSelectedProtein] = useState<ProteinLevel>(
    (form.proteinLevel as ProteinLevel) || "medium"
  );

  const [proteinMode, setProteinMode] = useState<ProteinMode>(
    form.recommendedProteinG ? "custom" : "auto"
  );

  const [customProtein, setCustomProtein] = useState(
    form.recommendedProteinG ? String(form.recommendedProteinG) : ""
  );

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showProteinModal, setShowProteinModal] = useState(false);

  const autoRecommendedProtein = useMemo(() => {
    const result = calculateRecommendedProtein(
      String(currentWeight || 0),
      selectedProtein as any
    );
    return result ?? 0;
  }, [calculateRecommendedProtein, currentWeight, selectedProtein]);

  const finalProtein = useMemo(() => {
    if (proteinMode === "custom") {
      const parsed = Number(customProtein);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    return autoRecommendedProtein > 0 ? autoRecommendedProtein : 0;
  }, [proteinMode, customProtein, autoRecommendedProtein]);

  const activityLabel = useMemo(() => {
    return (
      activityOptions.find((item) => item.value === selectedActivity)?.label ?? "-"
    );
  }, [selectedActivity]);

  const proteinLabel = useMemo(() => {
    return (
      proteinOptions.find((item) => item.value === selectedProtein)?.label ?? "-"
    );
  }, [selectedProtein]);

  const proteinHint = useMemo(() => {
    return (
      proteinOptions.find((item) => item.value === selectedProtein)?.hint ?? "-"
    );
  }, [selectedProtein]);

  const handleSelectProteinMode = (mode: ProteinMode) => {
    Keyboard.dismiss();
    setProteinMode(mode);

    if (mode === "auto") {
      // เมื่อเลือกให้ระบบคำนวณ จะไม่ใช้ค่ากรอกเอง
      setCustomProtein("");
    }

    if (mode === "custom") {
      // เมื่อเลือกกรอกเอง ให้ใส่ค่าเริ่มต้นจาก auto เพื่อแก้ไขต่อได้สะดวก
      if (!customProtein && autoRecommendedProtein > 0) {
        setCustomProtein(String(autoRecommendedProtein));
      }
    }
  };

  const handleChangeCustomProtein = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;

    setCustomProtein(normalized);
  };

  const handleBlurCustomProtein = () => {
    if (!customProtein.trim()) return;

    const parsed = Number(customProtein);
    if (!Number.isFinite(parsed)) {
      setCustomProtein("");
      return;
    }

    const clamped = Math.max(0, Math.min(500, parsed));
    setCustomProtein(
      Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1)
    );
  };

  const handleNext = () => {
    Keyboard.dismiss();

    if (proteinMode === "custom") {
      const parsed = Number(customProtein);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        Alert.alert(
          "โปรตีนไม่ถูกต้อง",
          "กรุณากรอกปริมาณโปรตีนที่ต้องการให้ถูกต้อง"
        );
        return;
      }

      updateForm({
        activityLevel: selectedActivity as any,
        proteinLevel: selectedProtein as any,
        recommendedProteinG: parsed,
      });
    } else {
      updateForm({
        activityLevel: selectedActivity as any,
        proteinLevel: selectedProtein as any,
        recommendedProteinG: autoRecommendedProtein,
      });
    }

    router.push("/register/step6-1");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerBar}>
          <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>5.กิจกรรมและโปรตีน</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.sectionTitle}>ระดับกิจกรรมต่อวัน</Text>
          <Text style={styles.sectionDesc}>
            ใช้เพื่อช่วยประเมินการใช้พลังงานของร่างกาย
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
                    <Text
                      style={[
                        styles.optionTitle,
                        active && styles.optionTitleActive,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {active && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.optionDesc,
                      active && styles.optionDescActive,
                    ]}
                  >
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.helpButtonWrap}>
            <TouchableOpacity
              style={styles.helperButton}
              onPress={() => setShowActivityModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#666"
              />
              <Text style={styles.helperButtonText}>คำอธิบายระดับกิจกรรม</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>ระดับโปรตีนที่ต้องการ</Text>
          <Text style={styles.sectionDesc}>
            เลือกให้ระบบคำนวณ หรือกรอกเองได้ถ้าคุณมีแผนโปรตีนอยู่แล้ว
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                proteinMode === "auto" && styles.modeButtonActive,
              ]}
              onPress={() => handleSelectProteinMode("auto")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  proteinMode === "auto" && styles.modeButtonTextActive,
                ]}
              >
                ให้ระบบคำนวณ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                proteinMode === "custom" && styles.modeButtonActive,
              ]}
              onPress={() => handleSelectProteinMode("custom")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  proteinMode === "custom" && styles.modeButtonTextActive,
                ]}
              >
                กรอกเอง
              </Text>
            </TouchableOpacity>
          </View>

          {proteinMode === "auto" ? (
            <>
              <View style={styles.optionList}>
                {proteinOptions.map((item) => {
                  const active = selectedProtein === item.value;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => setSelectedProtein(item.value)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.optionTopRow}>
                        <Text
                          style={[
                            styles.optionTitle,
                            active && styles.optionTitleActive,
                          ]}
                        >
                          {item.label}
                        </Text>

                        {active && (
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.optionDesc,
                          active && styles.optionDescActive,
                        ]}
                      >
                        {item.desc}
                      </Text>

                      <Text
                        style={[
                          styles.optionHint,
                          active && styles.optionHintActive,
                        ]}
                      >
                        {item.hint}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.helpButtonWrap}>
                <TouchableOpacity
                  style={styles.helperButton}
                  onPress={() => setShowProteinModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#666"
                  />
                  <Text style={styles.helperButtonText}>คำอธิบายระดับโปรตีน</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.customProteinCard}>
              <Text style={styles.customProteinTitle}>โปรตีนที่ต้องการต่อวัน</Text>

              <View style={styles.customProteinInputWrap}>
                <TextInput
                  style={styles.customProteinInput}
                  value={customProtein}
                  onChangeText={handleChangeCustomProtein}
                  onBlur={handleBlurCustomProtein}
                  keyboardType="decimal-pad"
                  placeholder="กรอกโปรตีนที่ต้องการ"
                  placeholderTextColor="#999"
                />
                <Text style={styles.customProteinUnit}>กรัม/วัน</Text>
              </View>

              <Text style={styles.customProteinHint}>
                เหมาะสำหรับผู้ที่มีแผนโภชนาการหรือเป้าหมายโปรตีนเฉพาะอยู่แล้ว
              </Text>
            </View>
          )}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>สรุปที่เลือก</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>กิจกรรม</Text>
              <Text style={styles.resultValue}>{activityLabel}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>โหมดโปรตีน</Text>
              <Text style={styles.resultValue}>
                {proteinMode === "auto" ? "ให้ระบบคำนวณ" : "กรอกเอง"}
              </Text>
            </View>

            {proteinMode === "auto" ? (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>ระดับโปรตีน</Text>
                  <Text style={styles.resultValue}>{proteinLabel}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>เกณฑ์โปรตีน</Text>
                  <Text style={styles.resultValue}>{proteinHint}</Text>
                </View>
              </>
            ) : null}

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabelStrong}>โปรตีนที่ใช้ต่อวัน</Text>
              <Text style={styles.resultValueStrong}>
                {finalProtein > 0 ? `${finalProtein} กรัม` : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>ถัดไป</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal visible={showActivityModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowActivityModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>คำอธิบายระดับกิจกรรม</Text>

              {activityOptions.map((item) => (
                <View key={item.value} style={styles.modalItem}>
                  <Text style={styles.modalItemTitle}>{item.label}</Text>
                  <Text style={styles.modalItemDesc}>{item.desc}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowActivityModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>เข้าใจแล้ว</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showProteinModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowProteinModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>คำอธิบายระดับโปรตีน</Text>

              {proteinOptions.map((item) => (
                <View key={item.value} style={styles.modalItem}>
                  <Text style={styles.modalItemTitle}>
                    {item.label} • {item.hint}
                  </Text>
                  <Text style={styles.modalItemDesc}>{item.desc}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProteinModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>เข้าใจแล้ว</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    alignItems: "center",
  },

  headerBarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },

  progressTrack: {
    marginTop: 12,
    height: 7,
    backgroundColor: "#D7CFBF",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    width: "56%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  sectionTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },

  sectionDesc: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
  },

  optionList: {
    marginTop: 12,
    gap: 12,
  },

  optionCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    padding: 14,
  },

  optionCardActive: {
    backgroundColor: ORANGE,
    borderColor: "#C97800",
  },

  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },

  optionTitleActive: {
    color: "#fff",
  },

  optionDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#555",
  },

  optionDescActive: {
    color: "#FFF7E8",
  },

  optionHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: "#7A5A00",
  },

  optionHintActive: {
    color: "#fff",
  },

  modeRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },

  modeButton: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modeButtonActive: {
    backgroundColor: ORANGE,
    borderColor: "#C97800",
  },

  modeButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#333",
  },

  modeButtonTextActive: {
    color: "#fff",
  },

  helpButtonWrap: {
    marginTop: 10,
    alignItems: "flex-end",
  },

  helperButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  helperButtonText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  customProteinCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#E3E3E3",
    padding: 14,
  },

  customProteinTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
  },

  customProteinInputWrap: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#CCC",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  customProteinInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    paddingVertical: 12,
  },

  customProteinUnit: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
    marginLeft: 8,
  },

  customProteinHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },

  resultCard: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#E3E3E3",
    padding: 16,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    gap: 10,
  },

  resultLabel: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
  },

  resultValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "900",
    textAlign: "right",
  },

  resultDivider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: "#EEE",
  },

  resultLabelStrong: {
    flex: 1,
    fontSize: 15,
    color: "#111",
    fontWeight: "900",
  },

  resultValueStrong: {
    fontSize: 18,
    color: ORANGE,
    fontWeight: "900",
    textAlign: "right",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 4,
  },

  backButton: {
    width: 120,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1.8,
    borderColor: "#333",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontWeight: "900",
    fontSize: 16,
    color: "#111",
  },

  nextButton: {
    width: 120,
    backgroundColor: ORANGE,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },

  nextButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    color: "#111",
    marginBottom: 14,
  },

  modalItem: {
    marginBottom: 14,
  },

  modalItemTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  modalItemDesc: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
    lineHeight: 21,
  },

  modalCloseButton: {
    marginTop: 16,
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCloseText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});