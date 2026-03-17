import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
                style={[
                  styles.cuisineItem,
                  isSelected
                    ? styles.cuisineItemSelected
                    : styles.cuisineItemUnselected,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleSelection(cuisine.id)}
              >
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
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        {/* --- ปุ่มล่าง --- */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/register/step7" as any)}
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

