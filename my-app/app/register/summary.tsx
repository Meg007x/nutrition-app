import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";
import { registerUserFromForm } from "../../services/auth";

type BmiStatus = {
  label: string;
  desc: string;
  color: string;
  pointerLeft: `${number}%`;
};

export default function RegisterSummaryScreen() {
  const { form, resetForm } = useRegister();
  const [submitting, setSubmitting] = useState(false);

  const bmi = form.bmi ?? 0;
  const weight = Number(form.weightKg || 0);
  const heightCm = Number(form.heightCm || 0);
  const age = Number(form.age || 20);

  const bmiStatus = useMemo<BmiStatus>(() => {
    if (!bmi) {
      return {
        label: "ยังไม่ทราบ",
        desc: "กรอกข้อมูลไม่ครบสำหรับการวิเคราะห์",
        color: "#999999",
        pointerLeft: "10%",
      };
    }

    if (bmi < 18.5) {
      return {
        label: "น้ำหนักน้อย",
        desc: "ตอนนี้คุณอยู่ในเกณฑ์น้ำหนักน้อย ควรเพิ่มพลังงานและโปรตีนอย่างเหมาะสม",
        color: "#F4B942",
        pointerLeft: "18%",
      };
    }

    if (bmi <= 22.9) {
      return {
        label: "น้ำหนักปกติ",
        desc: "ตอนนี้คุณอยู่ในเกณฑ์น้ำหนักปกติ น่าประทับใจมาก ควรรักษาสุขภาพที่ยอดเยี่ยมนี้เอาไว้",
        color: "#15E832",
        pointerLeft: "23%",
      };
    }

    if (bmi <= 24.9) {
      return {
        label: "น้ำหนักเกิน",
        desc: "ตอนนี้คุณเริ่มมีน้ำหนักเกินเล็กน้อย ควรปรับอาหารและกิจกรรมให้สมดุลมากขึ้น",
        color: "#F08A24",
        pointerLeft: "58%",
      };
    }

    return {
      label: "อ้วน",
      desc: "ตอนนี้คุณมีน้ำหนักเกินเกณฑ์ค่อนข้างมาก ควรวางแผนโภชนาการและการใช้พลังงานอย่างจริงจัง",
      color: "#F00000",
      pointerLeft: "84%",
    };
  }, [bmi]);

  const proteinTarget = useMemo(() => {
    if (form.recommendedProteinG) return form.recommendedProteinG;
    if (!weight) return 0;

    let multiplier = 1.6;
    if (form.proteinLevel === "low") multiplier = 1.2;
    if (form.proteinLevel === "medium") multiplier = 1.6;
    if (form.proteinLevel === "high") multiplier = 2.0;

    return Math.round(weight * multiplier);
  }, [form.recommendedProteinG, form.proteinLevel, weight]);

  const targetCalories = useMemo(() => {
    if (!weight || !heightCm || !age) return 0;

    const genderFactor = form.gender === "หญิง" ? -161 : 5;
    const bmr = 10 * weight + 6.25 * heightCm - 5 * age + genderFactor;

    let activityMultiplier = 1.2;
    if (form.activityLevel === "light") activityMultiplier = 1.375;
    if (form.activityLevel === "moderate") activityMultiplier = 1.55;
    if (form.activityLevel === "active") activityMultiplier = 1.725;
    if (form.activityLevel === "very_active") activityMultiplier = 1.9;

    let tdee = bmr * activityMultiplier;

    if (form.goalType === "lose_weight") tdee -= 300;
    if (form.goalType === "gain_weight") tdee += 300;

    return Math.round(tdee);
  }, [weight, heightCm, age, form.gender, form.activityLevel, form.goalType]);

  const goalText = useMemo(() => {
    if (form.goalType === "gain_weight") return "เพิ่มน้ำหนัก (Bulk)";
    if (form.goalType === "lose_weight") return "ลดน้ำหนัก";
    return "ดูแลสมดุลร่างกาย";
  }, [form.goalType]);

  const expertText = useMemo(() => {
    if (form.goalType === "gain_weight") {
      return "ระบบแนะนำให้คุณเพิ่มกล้ามเนื้อเพื่ออัตราการเผาผลาญพลังงานที่ดีขึ้น และช่วยให้ร่างกายแข็งแรงขึ้น";
    }
    if (form.goalType === "lose_weight") {
      return "ระบบแนะนำให้คุณควบคุมพลังงานและเพิ่มการเคลื่อนไหว เพื่อให้ลดไขมันได้อย่างเหมาะสมและปลอดภัย";
    }
    return "ระบบแนะนำให้คุณรักษาสมดุลการกินและกิจกรรม เพื่อคงสุขภาพที่ดีในระยะยาว";
  }, [form.goalType]);

  const tipText = useMemo(() => {
    if (form.goalType === "gain_weight") {
      return "การเพิ่มกล้ามเนื้อเพียง 5 กิโลกรัม จะช่วยให้อัตราการเผาผลาญของคุณเพิ่มขึ้นอย่างมาก";
    }
    if (form.goalType === "lose_weight") {
      return "การควบคุมพลังงานร่วมกับโปรตีนที่เพียงพอ จะช่วยลดไขมันและรักษามวลกล้ามเนื้อได้ดีกว่า";
    }
    return "การกินให้ครบหมู่และสม่ำเสมอ ช่วยให้ร่างกายรักษาสมดุลได้ดีในระยะยาว";
  }, [form.goalType]);

  const handleStartPlan = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const response = await registerUserFromForm(form);
      console.log("สมัครสมาชิกสำเร็จ:", response);

      if (!response?.user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้จากระบบ");
      }

      await AsyncStorage.setItem("currentUser", JSON.stringify(response.user));

      Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อยแล้ว");

      resetForm();
      router.replace("/(tabs)/plan");
    } catch (error: any) {
      Alert.alert(
        "สมัครสมาชิกไม่สำเร็จ",
        error?.message || "กรุณาลองใหม่"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeGoal = () => {
    router.replace("/register/step4");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>สรุปผลวิเคราะห์ร่างกาย</Text>
        <Text style={styles.subtitle}>
          เราวิเคราะห์ข้อมูลจากสถิติของคุณเรียบร้อยแล้ว
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.topStatsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={styles.statValueDark}>
              {bmi ? bmi.toFixed(1) : "-"}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>เป้าหมายแคล</Text>
            <Text style={styles.statValueOrange}>
              {targetCalories ? targetCalories.toLocaleString() : "-"}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>โปรตีนที่ควรได้</Text>
            <Text style={styles.statValueRed}>
              {proteinTarget ? `${proteinTarget}g` : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, { backgroundColor: bmiStatus.color }]}
          />
          <Text style={styles.statusTitle}>สถานะปัจจุบัน</Text>
        </View>

        <Text style={styles.statusDesc}>
          ตอนนี้คุณอยู่ในเกณฑ์{" "}
          <Text style={[styles.statusHighlight, { color: bmiStatus.color }]}>
            {bmiStatus.label}
          </Text>{" "}
          {bmiStatus.label === "น้ำหนักปกติ"
            ? "น่าประทับใจมาก ควรรักษาสุขภาพที่ยอดเยี่ยมนี้เอาไว้"
            : bmiStatus.desc}
        </Text>

        <View style={styles.barWrap}>
          <View style={styles.bar}>
            <View style={[styles.barSection, styles.barGreen]} />
            <View style={[styles.barSection, styles.barYellow]} />
            <View style={[styles.barSection, styles.barRed]} />
          </View>
          <View style={[styles.pointer, { left: bmiStatus.pointerLeft }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>คำแนะนำจากผู้เชี่ยวชาญ</Text>

      <View style={styles.expertCard}>
        <View style={styles.expertTitleRow}>
          <Text style={styles.expertIcon}>🎯</Text>
          <Text style={styles.expertTitle}>{goalText}</Text>
        </View>

        <Text style={styles.expertDesc}>{expertText}</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={handleChangeGoal}>
          <Text style={styles.changeGoalText}>ปรับเปลี่ยนเป้าหมายของคุณ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={styles.tipCardText}>{tipText}</Text>
      </View>

      <TouchableOpacity
        style={[styles.startButton, submitting && styles.startButtonDisabled]}
        onPress={handleStartPlan}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text style={styles.startButtonText}>เริ่มต้นแผนการกินของคุณ</Text>
            <Text style={styles.startArrow}>→</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    color: "#000",
    fontFamily: "NotoSansThaiBold",
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#7B7B7B",
    fontFamily: "NotoSansThai",
    marginTop: 2,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#F2F2F2",
    borderWidth: 1.5,
    borderColor: "#111",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    marginBottom: 18,
  },
  topStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 15,
    color: "#676767",
    fontFamily: "NotoSansThaiBold",
    marginBottom: 2,
    textAlign: "center",
  },
  statValueDark: {
    fontSize: 18,
    color: "#111",
    fontFamily: "NotoSansThaiBold",
  },
  statValueOrange: {
    fontSize: 18,
    color: "#F28C1B",
    fontFamily: "NotoSansThaiBold",
  },
  statValueRed: {
    fontSize: 18,
    color: "#E40000",
    fontFamily: "NotoSansThaiBold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 18,
    color: "#111",
    fontFamily: "NotoSansThaiBold",
  },
  statusDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    fontFamily: "NotoSansThai",
    marginBottom: 14,
  },
  statusHighlight: {
    fontFamily: "NotoSansThaiBold",
  },
  barWrap: {
    position: "relative",
    marginTop: 2,
    paddingBottom: 6,
  },
  bar: {
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#DDD",
  },
  barSection: {
    height: "100%",
  },
  barGreen: {
    flex: 3,
    backgroundColor: "#15F12F",
  },
  barYellow: {
    flex: 4,
    backgroundColor: "#F1C356",
  },
  barRed: {
    flex: 3,
    backgroundColor: "#F00000",
  },
  pointer: {
    position: "absolute",
    top: 13,
    width: 0,
    height: 0,
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#000",
  },
  sectionTitle: {
    fontSize: 20,
    color: "#111",
    fontFamily: "NotoSansThaiBold",
    marginLeft: 12,
    marginBottom: 12,
  },
  expertCard: {
    backgroundColor: "#F2C75D",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,
  },
  expertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  expertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  expertTitle: {
    fontSize: 20,
    color: "#000",
    fontFamily: "NotoSansThaiBold",
  },
  expertDesc: {
    fontSize: 15,
    color: "#000",
    lineHeight: 24,
    fontFamily: "NotoSansThai",
    marginBottom: 10,
  },
  changeGoalText: {
    fontSize: 15,
    color: "#E00000",
    textDecorationLine: "underline",
    textAlign: "right",
    fontFamily: "NotoSansThai",
  },
  tipCard: {
    backgroundColor: "#0A1025",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 70,
  },
  tipEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  tipCardText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: "#FFF",
    fontFamily: "NotoSansThai",
  },
  startButton: {
    backgroundColor: "#F4BF45",
    borderRadius: 22,
    minHeight: 58,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: 18,
    color: "#000",
    fontFamily: "NotoSansThaiBold",
  },
  startArrow: {
    fontSize: 28,
    color: "#000",
    fontFamily: "NotoSansThaiBold",
    marginLeft: 12,
  },
});