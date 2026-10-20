import React, { useMemo, useState } from "react";
import {
  View,
  Text,
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
import styles from "./step4.styles";

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

/**
 * เกณฑ์สำหรับการออกแบบระบบ
 *
 * ใช้เพื่อคำนวณ "ระยะเวลาแนะนำโดยประมาณ"
 * ไม่ใช่ข้อกำหนดทางการแพทย์เฉพาะบุคคล
 */
const GOAL_WEIGHT_PACE_KG_PER_WEEK = 0.5;

export default function RegisterStep4Screen() {
  const { form, updateForm } = useRegister();

  const currentWeight = form.weightKg ? Number(form.weightKg) : 0;
  const currentHeightCm = form.heightCm ? Number(form.heightCm) : 0;
  const currentBmi = form.bmi ?? null;

  const initialGoalType: GoalType = form.goalType || "lose_weight";

  const initialGoalWeeks =
    form.goalDurationWeeks &&
    weekOptions.includes(
      form.goalDurationWeeks as (typeof weekOptions)[number]
    )
      ? form.goalDurationWeeks
      : "4 สัปดาห์";

  const initialTargetWeight =
    form.targetWeightKg && form.targetWeightKg.trim()
      ? form.targetWeightKg
      : currentWeight > 0
      ? currentWeight.toFixed(1)
      : "0";

  const [selectedGoalType, setSelectedGoalType] =
    useState<GoalType>(initialGoalType);

  const [targetWeight, setTargetWeight] =
    useState(initialTargetWeight);

  const [selectedWeek, setSelectedWeek] =
    useState(initialGoalWeeks);

  const [showAdviceModal, setShowAdviceModal] =
    useState(false);

  const [showWeekModal, setShowWeekModal] =
    useState(false);

  const [showWarningModal, setShowWarningModal] =
    useState(false);

  const [warningMessage, setWarningMessage] =
    useState("");

  const selectedGoalLabel = useMemo(() => {
    const found = goalOptions.find(
      (item) => item.value === selectedGoalType
    );

    return found?.label ?? "ลดน้ำหนัก";
  }, [selectedGoalType]);

  const parsedTargetWeight = useMemo(() => {
    const n = parseFloat(targetWeight);

    return Number.isFinite(n) ? n : 0;
  }, [targetWeight]);

  /**
   * ส่วนต่างน้ำหนัก
   *
   * positive = ต้องเพิ่มน้ำหนัก
   * negative = ต้องลดน้ำหนัก
   */
  const weightDiff = useMemo(() => {
    if (!currentWeight || !parsedTargetWeight) {
      return 0;
    }

    return Number(
      (parsedTargetWeight - currentWeight).toFixed(1)
    );
  }, [currentWeight, parsedTargetWeight]);

  /**
   * จำนวนกิโลกรัมที่ต้องเปลี่ยนจริง
   */
  const absoluteWeightDiff = useMemo(() => {
    return Math.abs(weightDiff);
  }, [weightDiff]);

  /**
   * คำนวณจำนวนสัปดาห์ขั้นต่ำโดยประมาณ
   *
   * เช่น
   * ต้องเปลี่ยน 5 กก.
   * 5 / 0.5 = 10 สัปดาห์
   */
  const recommendedWeeks = useMemo(() => {
    if (
      selectedGoalType === "maintain" ||
      absoluteWeightDiff <= 0
    ) {
      return 0;
    }

    return Math.ceil(
      absoluteWeightDiff / GOAL_WEIGHT_PACE_KG_PER_WEEK
    );
  }, [selectedGoalType, absoluteWeightDiff]);

  /**
   * หาตัวเลือกระยะเวลาที่มีอยู่ในระบบ
   * ที่เพียงพอต่อระยะเวลาที่คำนวณได้
   *
   * เช่น ระบบคำนวณได้ 9 สัปดาห์
   * ตัวเลือกที่มีคือ 8 และ 10
   * ระบบจะแนะนำ 10 สัปดาห์
   */
  const recommendedAvailableWeek = useMemo(() => {
    if (!recommendedWeeks) {
      return 0;
    }

    const availableWeeks = weekOptions.map((week) =>
      parseInt(week, 10)
    );

    const suitableWeek = availableWeeks.find(
      (week) => week >= recommendedWeeks
    );

    return suitableWeek ?? recommendedWeeks;
  }, [recommendedWeeks]);

  const selectedWeekNumber = useMemo(() => {
    return parseInt(selectedWeek, 10);
  }, [selectedWeek]);

  /**
   * ตรวจสอบว่าระยะเวลาที่เลือกสั้นเกินไปหรือไม่
   */
  const isDurationTooShort = useMemo(() => {
    if (
      selectedGoalType === "maintain" ||
      absoluteWeightDiff <= 0 ||
      recommendedWeeks <= 0
    ) {
      return false;
    }

    return selectedWeekNumber < recommendedWeeks;
  }, [
    selectedGoalType,
    absoluteWeightDiff,
    recommendedWeeks,
    selectedWeekNumber,
  ]);

  const recommendedText = useMemo(() => {
    if (selectedGoalType === "lose_weight") {
      return "แนะนำให้ตั้งเป้าลดน้ำหนักแบบค่อยเป็นค่อยไป โดยกำหนดระยะเวลาให้เหมาะสมกับปริมาณน้ำหนักที่ต้องการลด";
    }

    if (selectedGoalType === "gain_weight") {
      return "ควรเพิ่มน้ำหนักอย่างค่อยเป็นค่อยไป โดยเน้นรับประทานอาหารที่มีคุณค่าทางโภชนาการและได้รับพลังงานเพียงพอ";
    }

    return "เป้าหมายนี้เหมาะกับการรักษาน้ำหนักปัจจุบัน ควรเน้นการรับประทานอาหารที่สมดุลและการเคลื่อนไหวอย่างสม่ำเสมอ";
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
    if (!currentWeight) {
      return "-";
    }

    if (weightDiff === 0) {
      return "เป้าหมายเท่ากับน้ำหนักปัจจุบัน";
    }

    if (weightDiff > 0) {
      return `ต้องการเพิ่ม ${weightDiff.toFixed(
        1
      )} กก. จากน้ำหนักปัจจุบัน`;
    }

    return `ต้องการลด ${Math.abs(weightDiff).toFixed(
      1
    )} กก. จากน้ำหนักปัจจุบัน`;
  }, [currentWeight, weightDiff]);

  /**
   * แสดง Warning
   */
  const openWarning = (message: string) => {
    Keyboard.dismiss();
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const handleIncreaseWeight = () => {
    Keyboard.dismiss();

    const next = Math.min(
      300,
      (parsedTargetWeight || 0) + 1
    );

    setTargetWeight(
      Number.isInteger(next)
        ? String(next)
        : next.toFixed(1)
    );
  };

  const handleDecreaseWeight = () => {
    Keyboard.dismiss();

    const next = Math.max(
      0,
      (parsedTargetWeight || 0) - 1
    );

    setTargetWeight(
      Number.isInteger(next)
        ? String(next)
        : next.toFixed(1)
    );
  };

  const handleChangeWeight = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");

    const normalized =
      parts.length > 2
        ? `${parts[0]}.${parts.slice(1).join("")}`
        : cleaned;

    setTargetWeight(normalized);
  };

  const handleBlurWeight = () => {
    if (!targetWeight.trim()) {
      setTargetWeight(
        currentWeight > 0
          ? currentWeight.toFixed(1)
          : "0"
      );

      return;
    }

    const n = parseFloat(targetWeight);

    if (!Number.isFinite(n)) {
      setTargetWeight(
        currentWeight > 0
          ? currentWeight.toFixed(1)
          : "0"
      );

      return;
    }

    const clamped = Math.max(
      0,
      Math.min(300, n)
    );

    setTargetWeight(
      Number.isInteger(clamped)
        ? String(clamped)
        : clamped.toFixed(1)
    );
  };

  const handleSelectGoal = (goalType: GoalType) => {
    Keyboard.dismiss();

    setSelectedGoalType(goalType);

    if (
      goalType === "maintain" &&
      currentWeight > 0
    ) {
      setTargetWeight(
        currentWeight.toFixed(1)
      );
    }
  };

  /**
   * ตรวจสอบความสัมพันธ์ของเป้าหมายกับน้ำหนักปัจจุบัน
   */
  const validateGoalWeight = (
    safeTargetWeight: number
  ) => {
    if (!currentWeight) {
      return true;
    }

    if (
      selectedGoalType === "lose_weight" &&
      safeTargetWeight >= currentWeight
    ) {
      openWarning(
        `เป้าหมายลดน้ำหนักไม่สอดคล้องกับน้ำหนักปัจจุบัน\n\nน้ำหนักปัจจุบัน ${currentWeight.toFixed(
          1
        )} กก.\nน้ำหนักเป้าหมาย ${safeTargetWeight.toFixed(
          1
        )} กก.\n\nกรุณากำหนดน้ำหนักเป้าหมายให้น้อยกว่าน้ำหนักปัจจุบัน`
      );

      return false;
    }

    if (
      selectedGoalType === "gain_weight" &&
      safeTargetWeight <= currentWeight
    ) {
      openWarning(
        `เป้าหมายเพิ่มน้ำหนักไม่สอดคล้องกับน้ำหนักปัจจุบัน\n\nน้ำหนักปัจจุบัน ${currentWeight.toFixed(
          1
        )} กก.\nน้ำหนักเป้าหมาย ${safeTargetWeight.toFixed(
          1
        )} กก.\n\nกรุณากำหนดน้ำหนักเป้าหมายให้มากกว่าน้ำหนักปัจจุบัน`
      );

      return false;
    }

    return true;
  };

  /**
   * ตรวจสอบระยะเวลา
   */
  const validateDuration = () => {
    if (
      selectedGoalType === "maintain" ||
      absoluteWeightDiff <= 0
    ) {
      return true;
    }

    if (!recommendedWeeks) {
      return true;
    }

    if (
      selectedWeekNumber >= recommendedWeeks
    ) {
      return true;
    }

    const targetAction =
      selectedGoalType === "lose_weight"
        ? "ลด"
        : "เพิ่ม";

    const suggestedWeek =
      recommendedAvailableWeek || recommendedWeeks;

    openWarning(
      `ระยะเวลาไม่เหมาะสม\n\n` +
        `เป้าหมายของคุณต้องการ${targetAction}น้ำหนัก ` +
        `${absoluteWeightDiff.toFixed(1)} กก.\n` +
        `แต่ระยะเวลา ${selectedWeekNumber} สัปดาห์สั้นเกินไปสำหรับเป้าหมายนี้\n\n` +
        `ระยะเวลาแนะนำโดยประมาณ: อย่างน้อย ${suggestedWeek} สัปดาห์\n\n` +
        `กรุณาเลือกระยะเวลา ${suggestedWeek} สัปดาห์ขึ้นไป`
    );

    return false;
  };

  const handleNext = () => {
    Keyboard.dismiss();

    const safeTargetWeight = (() => {
      const n = parseFloat(targetWeight);

      if (!Number.isFinite(n)) {
        return currentWeight > 0
          ? currentWeight
          : 0;
      }

      return Math.max(
        0,
        Math.min(300, n)
      );
    })();

    /**
     * 1. ตรวจสอบว่าน้ำหนักเป้าหมายสัมพันธ์กับ Goal หรือไม่
     */
    if (
      !validateGoalWeight(safeTargetWeight)
    ) {
      return;
    }

    /**
     * 2. ตรวจสอบระยะเวลา
     */
    if (!validateDuration()) {
      return;
    }

    /**
     * 3. บันทึกข้อมูลเมื่อผ่าน validation แล้วเท่านั้น
     */
    updateForm({
      goalType: selectedGoalType,

      targetWeightKg:
        Number.isInteger(safeTargetWeight)
          ? String(safeTargetWeight)
          : safeTargetWeight.toFixed(1),

      goalDurationWeeks: selectedWeek,
    });

    router.push("/register/step5");
  };

  /**
   * เมื่อผู้ใช้เลือกระยะเวลา
   */
  const handleSelectWeek = (week: string) => {
    Keyboard.dismiss();

    setSelectedWeek(week);
    setShowWeekModal(false);

    /**
     * ตรวจสอบทันทีหลังเลือก
     */
    if (
      selectedGoalType !== "maintain" &&
      absoluteWeightDiff > 0 &&
      recommendedWeeks > 0
    ) {
      const selected = parseInt(week, 10);

      if (selected < recommendedWeeks) {
        const targetAction =
          selectedGoalType === "lose_weight"
            ? "ลด"
            : "เพิ่ม";

        const suggestedWeek =
          recommendedAvailableWeek ||
          recommendedWeeks;

        openWarning(
          `ระยะเวลาไม่เหมาะสม\n\n` +
            `เป้าหมายของคุณต้องการ${targetAction}น้ำหนัก ` +
            `${absoluteWeightDiff.toFixed(1)} กก.\n` +
            `แต่ระยะเวลา ${selected} สัปดาห์สั้นเกินไปสำหรับเป้าหมายนี้\n\n` +
            `ระยะเวลาแนะนำโดยประมาณ: อย่างน้อย ${suggestedWeek} สัปดาห์\n\n` +
            `กรุณาเลือกระยะเวลา ${suggestedWeek} สัปดาห์ขึ้นไป`
        );
      }
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <View style={styles.headerBar}>
          <Text style={styles.headerBarText}>
            ลงทะเบียนผู้ใช้งาน
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.stepTitle}>
            4.เป้าหมาย
          </Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.currentInfoCard}>
            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>
                ส่วนสูง
              </Text>

              <Text style={styles.currentInfoValue}>
                {currentHeightCm > 0
                  ? `${currentHeightCm} ซม.`
                  : "-"}
              </Text>
            </View>

            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>
                น้ำหนักปัจจุบัน
              </Text>

              <Text style={styles.currentInfoValue}>
                {currentWeight > 0
                  ? `${currentWeight.toFixed(
                      1
                    )} กก.`
                  : "-"}
              </Text>
            </View>

            <View style={styles.currentInfoRow}>
              <Text style={styles.currentInfoLabel}>
                BMI ปัจจุบัน
              </Text>

              <Text style={styles.currentInfoValue}>
                {currentBmi !== null
                  ? currentBmi.toFixed(1)
                  : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.goalHeader}>
            <Text style={styles.sectionTitle}>
              เลือกเป้าหมาย
            </Text>

            <TouchableOpacity
              style={styles.helpRow}
              onPress={() => {
                Keyboard.dismiss();
                setShowAdviceModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#111"
              />

              <Text style={styles.helpText}>
                คำแนะนำ
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inlineHint}>
            {goalHint}
          </Text>

          <View style={styles.goalGrid}>
            {goalOptions.map((goal) => {
              const active =
                selectedGoalType ===
                goal.value;

              return (
                <TouchableOpacity
                  key={goal.value}
                  style={[
                    styles.goalButton,
                    active &&
                      styles.goalButtonActive,
                  ]}
                  onPress={() =>
                    handleSelectGoal(
                      goal.value
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      active &&
                        styles.goalButtonTextActive,
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>
            น้ำหนักเป้าหมาย (กิโลกรัม)
          </Text>

          <View style={styles.weightInputWrap}>
            <TextInput
              style={styles.weightInput}
              value={targetWeight}
              onChangeText={
                handleChangeWeight
              }
              onBlur={handleBlurWeight}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="กรอกน้ำหนักเป้าหมาย"
              placeholderTextColor="#888"
            />

            <View style={styles.arrowWrap}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={
                  handleIncreaseWeight
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-up"
                  size={18}
                  color="#777"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.arrowButton}
                onPress={
                  handleDecreaseWeight
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color="#777"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.weightHelperText}>
            {summaryText}
          </Text>

          {/* แสดงระยะเวลาแนะนำ */}
          {selectedGoalType !== "maintain" &&
            absoluteWeightDiff > 0 &&
            recommendedWeeks > 0 && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#8A5A00",
                }}
              >
                ระยะเวลาแนะนำโดยประมาณ:{" "}
                {recommendedAvailableWeek}{" "}
                สัปดาห์ขึ้นไป
              </Text>
            )}

          <Text style={styles.inputLabel}>
            ระยะเวลา (สัปดาห์)
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBox,
              isDurationTooShort && {
                borderColor: "#E57373",
                borderWidth: 1.5,
              },
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setShowWeekModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.selectText}>
              {selectedWeek}
            </Text>

            <View
              style={styles.selectArrowWrap}
            >
              <Ionicons
                name="chevron-up"
                size={18}
                color="#777"
              />

              <Ionicons
                name="chevron-down"
                size={18}
                color="#777"
              />
            </View>
          </TouchableOpacity>

          {isDurationTooShort && (
            <Text
              style={{
                marginTop: 5,
                fontSize: 13,
                color: "#B00020",
              }}
            >
              ⚠️ ระยะเวลาสั้นเกินไป
              กรุณาเลือกระยะเวลาอย่างน้อย{" "}
              {recommendedAvailableWeek}{" "}
              สัปดาห์
            </Text>
          )}

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Keyboard.dismiss();
                router.back();
              }}
              activeOpacity={0.8}
            >
              <Text
                style={styles.backButtonText}
              >
                ย้อนกลับ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text
                style={styles.nextButtonText}
              >
                ถัดไป
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =========================
            Advice Modal
        ========================= */}
        <Modal
          visible={showAdviceModal}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowAdviceModal(false)
          }
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() =>
              setShowAdviceModal(false)
            }
          >
            <Pressable
              style={styles.modalCard}
              onPress={() => {}}
            >
              <Text
                style={styles.modalTitle}
              >
                คำแนะนำในการตั้งเป้าหมาย{" "}
                {selectedGoalLabel}
              </Text>

              <Text
                style={styles.modalBody}
              >
                {recommendedText}
              </Text>

              <TouchableOpacity
                style={
                  styles.modalCloseButton
                }
                onPress={() =>
                  setShowAdviceModal(false)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.modalCloseText
                  }
                >
                  เข้าใจแล้ว
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* =========================
            Week Selection Modal
        ========================= */}
        <Modal
          visible={showWeekModal}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowWeekModal(false)
          }
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() =>
              setShowWeekModal(false)
            }
          >
            <Pressable
              style={styles.modalCard}
              onPress={() => {}}
            >
              <Text
                style={styles.modalTitle}
              >
                เลือกระยะเวลา
              </Text>

              {selectedGoalType !==
                "maintain" &&
                recommendedAvailableWeek >
                  0 && (
                  <Text
                    style={{
                      marginBottom: 10,
                      fontSize: 13,
                      color: "#8A5A00",
                    }}
                  >
                    ระยะเวลาแนะนำโดยประมาณ:{" "}
                    {recommendedAvailableWeek}{" "}
                    สัปดาห์ขึ้นไป
                  </Text>
                )}

              {weekOptions.map((week) => {
                const active =
                  selectedWeek === week;

                const weekNumber =
                  parseInt(week, 10);

                const tooShort =
                  selectedGoalType !==
                    "maintain" &&
                  recommendedWeeks > 0 &&
                  weekNumber <
                    recommendedWeeks;

                const recommended =
                  selectedGoalType !==
                    "maintain" &&
                  recommendedAvailableWeek >
                    0 &&
                  weekNumber ===
                    recommendedAvailableWeek;

                return (
                  <TouchableOpacity
                    key={week}
                    style={[
                      styles.weekOption,
                      tooShort && {
                        opacity: 0.55,
                      },
                    ]}
                    onPress={() =>
                      handleSelectWeek(
                        week
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        flex: 1,
                        flexDirection:
                          "row",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <Text
                        style={[
                          styles.weekOptionText,
                          active &&
                            styles.weekOptionTextActive,
                        ]}
                      >
                        {week}
                      </Text>

                      {recommended && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#2E7D32",
                            fontWeight:
                              "700",
                          }}
                        >
                          ✓ แนะนำ
                        </Text>
                      )}

                      {tooShort && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#B00020",
                          }}
                        >
                          สั้นเกินไป
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={
                  styles.modalCancelButton
                }
                onPress={() =>
                  setShowWeekModal(false)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  ยกเลิก
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* =========================
            Warning Modal
        ========================= */}
        <Modal
          visible={showWarningModal}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowWarningModal(false)
          }
        >
          <View
            style={styles.modalOverlay}
          >
            <View
              style={[
                styles.modalCard,
                {
                  marginHorizontal: 24,
                },
              ]}
            >
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons
                  name="warning-outline"
                  size={48}
                  color="#E67E22"
                />
              </View>

              <Text
                style={[
                  styles.modalTitle,
                  {
                    textAlign: "center",
                  },
                ]}
              >
                ⚠️ ระยะเวลาไม่เหมาะสม
              </Text>

              <Text
                style={[
                  styles.modalBody,
                  {
                    textAlign: "center",
                    lineHeight: 24,
                  },
                ]}
              >
                {warningMessage}
              </Text>

              <TouchableOpacity
                style={
                  styles.modalCloseButton
                }
                onPress={() =>
                  setShowWarningModal(
                    false
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.modalCloseText
                  }
                >
                  เข้าใจแล้ว
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}