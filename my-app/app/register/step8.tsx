import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, IOS_GREEN } from "./step8.styles";

// 🔴 [BACKEND TODO]: อนาคตต้องดึงรายการประเภทอาหารเหล่านี้มาจาก API Database
const MOCK_CUISINES = [
  { id: "1", name: "อาหารอเมริกัน" },
  { id: "2", name: "อาหารเอเชีย" },
  { id: "3", name: "อาหารจีน" },
  { id: "4", name: "อาหารอินเดีย" },
  { id: "5", name: "อาหารอิตาลี" },
  { id: "6", name: "อาหารญี่ปุ่น" },
  { id: "7", name: "อาหารแม็กซิกัน" },
  { id: "8", name: "อาหารไทย" },
];

export default function RegisterStep8Screen() {
  const { form, updateForm } = useRegister();

  const initialSelected = useMemo(() => {
    if (!form.interestedCuisines || !Array.isArray(form.interestedCuisines)) {
      return [];
    }

    return MOCK_CUISINES.filter((item) =>
      form.interestedCuisines.includes(item.name)
    ).map((item) => item.id);
  }, [form.interestedCuisines]);

  const [selectedCuisines, setSelectedCuisines] =
    useState<string[]>(initialSelected);

  const toggleSelection = (id: string) => {
    if (selectedCuisines.includes(id)) {
      setSelectedCuisines((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedCuisines((prev) => [...prev, id]);
    }
  };

  const selectedCuisineNames = MOCK_CUISINES.filter((item) =>
    selectedCuisines.includes(item.id)
  ).map((item) => item.name);

  return (
    <SafeAreaView style={styles.container}>
      {/* --- แถบ Header --- */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>8.อาหารที่สนใจ</Text>

        {/* --- Progress Bar --- */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "95%" }]} />
        </View>

        <Text style={styles.subtitle}>ประเภทอาหารที่ชอบหรือสนใจ</Text>

        {/* --- รายการอาหาร (กดเลือกได้หลายอัน) --- */}
        <View style={styles.listContainer}>
          {MOCK_CUISINES.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine.id);

            return (
              <TouchableOpacity
                key={cuisine.id}
                style={{
                  ...styles.cuisineItem,
                  ...(isSelected ? styles.cuisineItemSelected : styles.cuisineItemUnselected),
                  ...(isSelected ? {
                    borderWidth: 2,
                    borderColor: ORANGE,
                    shadowColor: ORANGE,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 6,
                  } : {}),
                }}
                activeOpacity={0.7}
                onPress={() => toggleSelection(cuisine.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <Text
                    style={[
                      styles.cuisineText,
                      isSelected
                        ? styles.cuisineTextSelected
                        : styles.cuisineTextUnselected,
                    ]}
                  >
                    {cuisine.name}
                  </Text>
                  {/* ✅ Checkmark icon เมื่อถูกเลือก */}
                  {isSelected && (
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 14,
                      width: 28,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        {/* --- ปุ่มล่าง --- */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              updateForm({
                interestedCuisines: selectedCuisineNames,
              });

              console.log(
                "อาหารที่สนใจ เตรียมส่ง DB:",
                selectedCuisineNames
              );

              router.push("/register/step9" as any);
            }}
          >
            <Text style={styles.saveText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

