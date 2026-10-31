import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";
import type { ActivityLevel } from "../../types/register-types";
import styles from "./step5-activity.styles";

type SelectableActivityLevel = Exclude<ActivityLevel, "">;

const activityOptions: {
  value: SelectableActivityLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "sedentary",
    title: "กิจกรรมน้อย",
    description: "นั่งหรืออยู่กับที่เป็นส่วนใหญ่ และแทบไม่ได้ออกกำลังกาย",
  },
  {
    value: "light",
    title: "กิจกรรมเล็กน้อย",
    description: "ออกกำลังกายเบา ๆ หรือเคลื่อนไหวบ้าง ประมาณ 1–3 วันต่อสัปดาห์",
  },
  {
    value: "moderate",
    title: "กิจกรรมปานกลาง",
    description: "ออกกำลังกายระดับปานกลางประมาณ 3–5 วันต่อสัปดาห์",
  },
  {
    value: "active",
    title: "กิจกรรมหนัก",
    description: "ออกกำลังกายหนักเกือบทุกวัน หรือทำงานที่ใช้แรงและเคลื่อนไหวมาก",
  },
  {
    value: "extra_active",
    title: "กิจกรรมหนักมาก",
    description: "ฝึกซ้อมหนักมากทุกวัน ร่วมกับทำงานที่ใช้แรงมาก",
  },
];

export default function RegisterActivityLevelScreen() {
  const { form, updateForm } = useRegister();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>(
    form.activityLevel
  );
  const [showRequiredMessage, setShowRequiredMessage] = useState(false);

  const handleNext = () => {
    if (!selectedActivity) {
      setShowRequiredMessage(true);
      return;
    }

    updateForm({
      activityLevel: selectedActivity,
      proteinInputMode: "auto",
    });
    router.push("/register/step5");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.stepTitle}>5. ระดับกิจกรรม</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.sectionTitle}>
          โดยปกติคุณเคลื่อนไหวหรือออกกำลังกายระดับใด?
        </Text>
        <Text style={styles.sectionHint}>
          เลือกระดับที่ใกล้เคียงกับกิจวัตรส่วนใหญ่ของคุณ
        </Text>

        <View style={styles.options}>
          {activityOptions.map((option) => {
            const isSelected = selectedActivity === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                style={[styles.optionCard, isSelected && styles.optionCardActive]}
                onPress={() => {
                  setSelectedActivity(option.value);
                  setShowRequiredMessage(false);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeader}>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleActive,
                    ]}
                  >
                    {option.title}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#fff"
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.optionDescription,
                    isSelected && styles.optionDescriptionActive,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>
          เลือกตามกิจวัตรปกติ ไม่ใช่วันที่มีกิจกรรมมากเป็นพิเศษ
        </Text>
        {showRequiredMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
            กรุณาเลือกระดับกิจกรรมก่อนดำเนินการต่อ
          </Text>
        ) : null}

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
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
