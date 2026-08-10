import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, BG, IOS_GREEN, ROW_COLOR_1, ROW_COLOR_2 } from "./step6-1.styles";


const ALLERGIES = [
  "ถั่ว",
  "อาหารทะเล",
  "นมวัว",
  "กลูเตน",
  "ไข่",
  "แป้งสาลี",
];

const NONE_OPTION = "ไม่มี";

export default function RegisterStep6Screen() {
  const { form, updateForm } = useRegister();

  // 1. สร้าง State แบบ Object เพื่อให้คุยกับหน้า 6-2 รู้เรื่อง
  const [localAllergies, setLocalAllergies] = useState(() => {
    const fa = form.allergies || {};
    if (Array.isArray(fa)) {
      return { veg: [], condiment: [], meat: [], other: fa };
    }
    return {
      veg: fa.veg || [],
      condiment: fa.condiment || [],
      meat: fa.meat || [],
      other: fa.other || [],
    };
  });

  // 2. ดึงข้อมูลใหม่เสมอเมื่อ form.allergies ใน Context เปลี่ยน
  useEffect(() => {
    const fa = form.allergies || {};
    if (Array.isArray(fa)) {
      setLocalAllergies({ veg: [], condiment: [], meat: [], other: fa });
    } else {
      setLocalAllergies({
        veg: fa.veg || [],
        condiment: fa.condiment || [],
        meat: fa.meat || [],
        other: fa.other || [],
      });
    }
  }, [form.allergies]);

  // 3. แปลง Object ให้กลับมาเป็น Array ธรรมดา เพื่อให้ UI ของคุณเอาไปใช้งานได้เหมือนเดิมเป๊ะๆ
  const selectedAllergies = useMemo(() => {
    return [
      ...(localAllergies.veg || []),
      ...(localAllergies.condiment || []),
      ...(localAllergies.meat || []),
      ...(localAllergies.other || []),
    ];
  }, [localAllergies]);

  const hasNoneSelected = selectedAllergies.includes(NONE_OPTION);
  const selectedFoodOnly = selectedAllergies.filter((item) => item !== NONE_OPTION);

  const toggleAllergy = (option: string) => {
    if (hasNoneSelected) {
      Alert.alert(
        "เลือกไม่ได้",
        "คุณเลือก 'ไม่มี' อยู่ หากต้องการเลือกรายการเพิ่ม กรุณายกเลิก 'ไม่มี' ก่อน"
      );
      return;
    }

    setLocalAllergies((prev: any) => {
      const prevOther = prev.other || [];
      if (prevOther.includes(option)) {
        return { ...prev, other: prevOther.filter((item: string) => item !== option) };
      } else {
        return { ...prev, other: [...prevOther, option] };
      }
    });
  };

  const toggleNone = () => {
    if (hasNoneSelected) {
      setLocalAllergies({ veg: [], condiment: [], meat: [], other: [] });
      return;
    }

    if (selectedFoodOnly.length > 0) {
      Alert.alert(
        "ยืนยันการเลือก",
        "หากเลือก 'ไม่มี' ระบบจะล้างรายการที่เลือกทั้งหมด",
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ยืนยัน",
            style: "destructive",
            onPress: () =>
              setLocalAllergies({ veg: [], condiment: [], meat: [], other: [NONE_OPTION] }),
          },
        ]
      );
      return;
    }

    setLocalAllergies({ veg: [], condiment: [], meat: [], other: [NONE_OPTION] });
  };

  const handleOpenMore = () => {
    if (hasNoneSelected) {
      Alert.alert(
        "เลือกไม่ได้",
        "คุณเลือก 'ไม่มี' อยู่ จึงไม่สามารถเพิ่มรายการได้"
      );
      return;
    }

    // ส่ง Object เข้า Context
    updateForm({
      hasAllergies: true,
      allergies: localAllergies,
    });

    router.push("/register/step6-2" as any);
  };

  const handleNext = () => {
    if (selectedAllergies.length === 0) {
      Alert.alert(
        "ยังไม่ได้เลือกข้อมูล",
        "กรุณาเลือกรายการ หรือเลือก 'ไม่มี'"
      );
      return;
    }

    // ส่ง Object เข้า Context
    updateForm({
      hasAllergies: !hasNoneSelected,
      allergies: localAllergies,
    });

    router.push("/register/step7" as any);
  };

  const removeSelectedItem = (itemToRemove: string) => {
    // ลบออกจากทุกหมวดหมู่
    setLocalAllergies((prev: any) => ({
      veg: (prev.veg || []).filter((item: string) => item !== itemToRemove),
      condiment: (prev.condiment || []).filter((item: string) => item !== itemToRemove),
      meat: (prev.meat || []).filter((item: string) => item !== itemToRemove),
      other: (prev.other || []).filter((item: string) => item !== itemToRemove),
    }));
  };

  const isSelected = (option: string) => selectedAllergies.includes(option);

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
          <Text style={styles.stepTitle}>6. วัตถุดิบที่แพ้</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "75%" }]} />
          </View>

          <Text style={styles.subtitle}>
            เลือกรายการวัตถุดิบที่คุณแพ้ หรือกดข้ามได้เลย
          </Text>

          <View style={styles.gridContainer}>
            {ALLERGIES.map((item) => {
              const active = isSelected(item);
              const disabled = hasNoneSelected;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.allergyBtn,
                    active && styles.allergyBtnActive,
                    disabled && !active && styles.disabledButton,
                  ]}
                  onPress={() => toggleAllergy(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.allergyText,
                      active && styles.allergyTextActive,
                      disabled && !active && styles.disabledText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.otherBtn, hasNoneSelected && styles.disabledOtherBtn]}
            onPress={handleOpenMore}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.otherBtnText,
                hasNoneSelected && styles.disabledText,
              ]}
            >
              + อื่นๆ / รายการเพิ่มเติม
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.noneBtn,
              isSelected(NONE_OPTION) && styles.noneBtnActive,
            ]}
            onPress={toggleNone}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.noneBtnText,
                isSelected(NONE_OPTION) && styles.noneBtnTextActive,
              ]}
            >
              ไม่มี
            </Text>
          </TouchableOpacity>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>สรุปรายการที่เลือก</Text>

            {selectedAllergies.length > 0 ? (
              <View style={styles.summaryChipWrap}>
                {selectedAllergies.map((item) => (
                  <View key={item} style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => removeSelectedItem(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.summaryChipRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.summaryText}>-</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/register/step5" as any)}
            >
              <Text style={styles.backText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>ถัดไป</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

