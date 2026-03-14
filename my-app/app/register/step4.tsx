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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import { GoalType } from "../../types/register-types";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const WHITE = "#FFFFFF";

const weekOptions = [
  "1 สัปดาห์",
  "2 สัปดาห์",
  "3 สัปดาห์",
  "4 สัปดาห์",
  "6 สัปดาห์",
  "8 สัปดาห์",
  "10 สัปดาห์",
  "12 สัปดาห์",
] as const;

const goalOptions: { label: string; value: GoalType }[] = [
  { label: "ลดน้ำหนัก", value: "lose_weight" },
  { label: "รักษารูปร่าง", value: "maintain" },
  { label: "เพิ่มน้ำหนัก", value: "gain_weight" },
];

export default function RegisterStep4Screen() {
  const { form, updateForm } = useRegister();

  const currentWeight = form.weightKg ? Number(form.weightKg) : 0;
  const currentHeightCm = form.heightCm ? Number(form.heightCm) : 0;
  const currentBmi = form.bmi ?? null;

  const initialGoalType: GoalType = form.goalType || "lose_weight";
  const initialGoalWeeks = form.goalDurationWeeks || "4 สัปดาห์";
  const initialTargetWeight =
    form.targetWeightKg && form.targetWeightKg.trim()
      ? form.targetWeightKg
      : currentWeight > 0
      ? currentWeight.toFixed(1)
      : "0";

  const [selectedGoalType, setSelectedGoalType] =
    useState<GoalType>(initialGoalType);
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight);
  const [selectedWeek, setSelectedWeek] = useState(initialGoalWeeks);

  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);

  const selectedGoalLabel = useMemo(() => {
    const found = goalOptions.find((item) => item.value === selectedGoalType);
    return found?.label ?? "ลดน้ำหนัก";
  }, [selectedGoalType]);

  const parsedTargetWeight = useMemo(() => {
    const n = parseFloat(targetWeight);
    return Number.isFinite(n) ? n : 0;
  }, [targetWeight]);

  const weightDiff = useMemo(() => {
    if (!currentWeight || !parsedTargetWeight) return 0;
    return Number((parsedTargetWeight - currentWeight).toFixed(1));
  }, [currentWeight, parsedTargetWeight]);

  const recommendedText = useMemo(() => {
    if (selectedGoalType === "lose_weight") {
      return "แนะนำให้ตั้งเป้าลดน้ำหนักแบบค่อยเป็นค่อยไป ประมาณ 0.25 - 1 กก. ต่อสัปดาห์ เพื่อให้ปลอดภัยและทำได้จริง";
    }
    if (selectedGoalType === "gain_weight") {
      return "ควรเพิ่มน้ำหนักอย่างสมดุล โดยเน้นอาหารคุณภาพดีและพลังงานเพียงพอ ประมาณ 0.25 - 0.5 กก. ต่อสัปดาห์";
    }
    return "เป้าหมายนี้เหมาะกับการรักษาน้ำหนักปัจจุบัน ควรเน้นการกินสมดุลและการเคลื่อนไหวอย่างสม่ำเสมอ";
  }, [selectedGoalType]);

  const goalHint = useMemo(() => {
    if (selectedGoalType === "lose_weight") {
      return "ควรตั้งเป้าหมายให้น้อยกว่าน้ำหนักปัจจุบัน";
    }
    if (selectedGoalType === "gain_weight") {
      return "ควรตั้งเป้าหมายให้มากกว่าน้ำหนักปัจจุบัน";
    }
    return "สามารถใช้น้ำหนักปัจจุบันเป็นเป้าหมายได้";
  }, [selectedGoalType]);

  const summaryText = useMemo(() => {
    if (!currentWeight) return "-";

    if (weightDiff === 0) {
      return "เป้าหมายเท่ากับน้ำหนักปัจจุบัน";
    }

    if (weightDiff > 0) {
      return `ต้องการเพิ่ม ${weightDiff.toFixed(1)} กก. จากน้ำหนักปัจจุบัน`;
    }

    return `ต้องการลด ${Math.abs(weightDiff).toFixed(1)} กก. จากน้ำหนักปัจจุบัน`;
  }, [currentWeight, weightDiff]);

  const handleIncreaseWeight = () => {
    Keyboard.dismiss();
    const next = Math.min(300, (parsedTargetWeight || 0) + 1);
    setTargetWeight(Number.isInteger(next) ? String(next) : next.toFixed(1));
  };

  const handleDecreaseWeight = () => {
    Keyboard.dismiss();
    const next = Math.max(0, (parsedTargetWeight || 0) - 1);
    setTargetWeight(Number.isInteger(next) ? String(next) : next.toFixed(1));
  };

  const handleChangeWeight = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;

    setTargetWeight(normalized);
  };

  const handleBlurWeight = () => {
    if (!targetWeight.trim()) {
      setTargetWeight(currentWeight > 0 ? currentWeight.toFixed(1) : "0");
      return;
    }

    const n = parseFloat(targetWeight);

    if (!Number.isFinite(n)) {
      setTargetWeight(currentWeight > 0 ? currentWeight.toFixed(1) : "0");
      return;
    }

    const clamped = Math.max(0, Math.min(300, n));
    setTargetWeight(
      Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1)
    );
  };

  const handleSelectGoal = (goalType: GoalType) => {
    Keyboard.dismiss();
    setSelectedGoalType(goalType);

    if (goalType === "maintain" && currentWeight > 0) {
      setTargetWeight(currentWeight.toFixed(1));
    }
  };

  const handleNext = () => {
    Keyboard.dismiss();

    const safeTargetWeight = (() => {
      const n = parseFloat(targetWeight);
      if (!Number.isFinite(n)) return currentWeight > 0 ? currentWeight : 0;
      return Math.max(0, Math.min(300, n));
    })();

    updateForm({
      goalType: selectedGoalType,
      targetWeightKg: Number.isInteger(safeTargetWeight)
        ? String(safeTargetWeight)
        : safeTargetWeight.toFixed(1),
      goalDurationWeeks: selectedWeek,
    });

    router.push("/register/step5");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerBar}>
          <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.stepTitle}>4.เป้าหมาย</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.currentInfoCard}>
            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>ส่วนสูง</Text>
              <Text style={styles.currentInfoValue}>
                {currentHeightCm > 0 ? `${currentHeightCm} ซม.` : "-"}
              </Text>
            </View>

            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>น้ำหนักปัจจุบัน</Text>
              <Text style={styles.currentInfoValue}>
                {currentWeight > 0 ? `${currentWeight.toFixed(1)} กก.` : "-"}
              </Text>
            </View>

            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>BMI ปัจจุบัน</Text>
              <Text style={styles.currentInfoValue}>
                {currentBmi !== null ? currentBmi.toFixed(1) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.goalHeader}>
            <Text style={styles.sectionTitle}>เลือกเป้าหมาย</Text>

            <TouchableOpacity
              style={styles.helpRow}
              onPress={() => {
                Keyboard.dismiss();
                setShowAdviceModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#111" />
              <Text style={styles.helpText}>คำแนะนำ</Text>
              <Ionicons name="chevron-forward" size={16} color="#111" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inlineHint}>{goalHint}</Text>

          <View style={styles.goalGrid}>
            {goalOptions.map((goal) => {
              const active = selectedGoalType === goal.value;

              return (
                <TouchableOpacity
                  key={goal.value}
                  style={[styles.goalButton, active && styles.goalButtonActive]}
                  onPress={() => handleSelectGoal(goal.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      active && styles.goalButtonTextActive,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>น้ำหนักเป้าหมาย (กิโลกรัม)</Text>

          <View style={styles.weightInputWrap}>
            <TextInput
              style={styles.weightInput}
              value={targetWeight}
              onChangeText={handleChangeWeight}
              onBlur={handleBlurWeight}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="กรอกน้ำหนักเป้าหมาย"
              placeholderTextColor="#888"
            />

            <View style={styles.arrowWrap}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleIncreaseWeight}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-up" size={18} color="#777" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleDecreaseWeight}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-down" size={18} color="#777" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.weightHelperText}>{summaryText}</Text>

          <Text style={styles.inputLabel}>ระยะเวลา (สัปดาห์)</Text>

          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => {
              Keyboard.dismiss();
              setShowWeekModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.selectText}>{selectedWeek}</Text>

            <View style={styles.selectArrowWrap}>
              <Ionicons name="chevron-up" size={18} color="#777" />
              <Ionicons name="chevron-down" size={18} color="#777" />
            </View>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Keyboard.dismiss();
                router.back();
              }}
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
        </View>

        <Modal visible={showAdviceModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowAdviceModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>
                คำแนะนำในการตั้งเป้าหมาย {selectedGoalLabel}
              </Text>
              <Text style={styles.modalBody}>{recommendedText}</Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAdviceModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>เข้าใจแล้ว</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showWeekModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowWeekModal(false)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>เลือกระยะเวลา</Text>

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
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.weekOptionText,
                        active && styles.weekOptionTextActive,
                      ]}
                    >
                      {week}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWeekModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
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
    width: "42%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  currentInfoCard: {
    marginTop: 18,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  currentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  currentInfoLabel: {
    fontSize: 14,
    color: "#6B5A3D",
    fontWeight: "700",
  },

  currentInfoValue: {
    fontSize: 15,
    color: "#111",
    fontWeight: "900",
  },

  goalHeader: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },

  helpRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  helpText: {
    marginLeft: 4,
    marginRight: 2,
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
  },

  inlineHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
  },

  goalGrid: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  goalButton: {
    flex: 1,
    minHeight: 54,
    backgroundColor: "#EA8D20",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },

  goalButtonActive: {
    backgroundColor: "#D77C14",
    borderWidth: 2,
    borderColor: "#B85F00",
  },

  goalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  goalButtonTextActive: {
    color: "#fff",
  },

  inputLabel: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
  },

  weightInputWrap: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 52,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  weightInput: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    paddingVertical: 12,
  },

  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  arrowButton: {
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  weightHelperText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    fontWeight: "700",
  },

  selectBox: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#333",
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  selectText: {
    fontSize: 16,
    color: "#111",
  },

  selectArrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
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

  modalBody: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
  },

  modalCloseButton: {
    marginTop: 24,
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

  weekOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  weekOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },

  weekOptionTextActive: {
    color: ORANGE,
    fontWeight: "900",
  },

  modalCancelButton: {
    marginTop: 16,
    backgroundColor: "#EFEFEF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#333",
    fontWeight: "800",
    fontSize: 16,
  },
});