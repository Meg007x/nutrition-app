import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRegister } from "../../context/register-context";
import { scheduleMealNotifications } from "../notifications";
// นำเข้า styles ทั้งก้อน และนำเข้าสี ORANGE, IOS_GREEN มาใช้กับพวก <Ionicons> หรือ <Switch>
import styles, { ORANGE, IOS_GREEN } from "./step9.styles";


type MealItem = {
  id: string;
  name: string;
  time: string;
  notify: boolean;
};

const DEFAULT_MEALS: MealItem[] = [
  { id: "1", name: "เช้า", time: "08:30", notify: true },
  { id: "2", name: "กลางวัน", time: "12:30", notify: true },
  { id: "3", name: "เย็น", time: "18:30", notify: true },
];

function normalizeMealsFromForm(mealTimes: any): MealItem[] {
  if (Array.isArray(mealTimes) && mealTimes.length > 0) {
    return mealTimes.map((item: any, index: number) => ({
      id: String(item.id ?? index + 1),
      name: item.name ?? `มื้อที่ ${index + 1}`,
      time: item.time ?? "12:00",
      notify: typeof item.notify === "boolean" ? item.notify : true,
    }));
  }

  if (mealTimes && typeof mealTimes === "object") {
    const mapped: MealItem[] = [];

    if (mealTimes.breakfast) {
      mapped.push({
        id: "1",
        name: "เช้า",
        time: mealTimes.breakfast,
        notify: true,
      });
    }
    if (mealTimes.lunch) {
      mapped.push({
        id: "2",
        name: "กลางวัน",
        time: mealTimes.lunch,
        notify: true,
      });
    }
    if (mealTimes.dinner) {
      mapped.push({
        id: "3",
        name: "เย็น",
        time: mealTimes.dinner,
        notify: true,
      });
    }
    if (mealTimes.snack) {
      mapped.push({
        id: "4",
        name: "ของว่าง",
        time: mealTimes.snack,
        notify: true,
      });
    }

    if (mapped.length > 0) return mapped;
  }

  return DEFAULT_MEALS;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export default function RegisterStep9Screen() {
  const { form, updateForm } = useRegister();

  const initialMeals = useMemo(() => {
    return normalizeMealsFromForm(form.mealTimes);
  }, [form.mealTimes]);

  const [mealCount, setMealCount] = useState(initialMeals.length || 3);
  const [meals, setMeals] = useState<MealItem[]>(initialMeals);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);

  const handleSelectCount = (count: number) => {
    setMealCount(count);
    setShowDropdown(false);

    let newMeals = [...meals];

    if (count > newMeals.length) {
      for (let i = newMeals.length; i < count; i++) {
        newMeals.push({
          id: String(Date.now() + i), // กันบั๊ก ID ซ้ำ
          name:
            i === 0 ? "เช้า"
              : i === 1 ? "กลางวัน"
              : i === 2 ? "เย็น"
              : i === 3 ? "ของว่าง"
              : `มื้อที่ ${i + 1}`,
          time: "12:00",
          notify: true,
        });
      }
    } else if (count < newMeals.length) {
      newMeals = newMeals.slice(0, count);
    }

    setMeals(newMeals);
  };

  // 🚀 ฟังก์ชันใหม่: ลบมื้ออาหาร (แบบกดไอคอนถังขยะ)
  const handleRemoveMeal = (idToRemove: string) => {
    if (meals.length <= 1) {
      Alert.alert("ไม่สามารถลบได้", "ต้องมีมื้ออาหารอย่างน้อย 1 มื้อครับ");
      return;
    }
    const updatedMeals = meals.filter((m) => m.id !== idToRemove);
    setMeals(updatedMeals);
    setMealCount(updatedMeals.length); // ซิงค์จำนวนตัวเลขกลับไปที่ Dropdown
  };

  // 🚀 ฟังก์ชันใหม่: เพิ่มมื้ออาหาร (แบบกดปุ่มเพิ่มด้านล่าง)
  const handleAddMeal = () => {
    const newMeal: MealItem = {
      id: String(Date.now()), // สร้าง ID ใหม่
      name: `มื้อที่ ${meals.length + 1}`,
      time: "12:00",
      notify: true,
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    setMealCount(updatedMeals.length); // ซิงค์จำนวนตัวเลขกลับไปที่ Dropdown
  };

  const updateMeal = (
    id: string,
    field: keyof MealItem,
    value: string | boolean
  ) => {
    setMeals((prev) =>
      prev.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal))
    );
  };

  const openPicker = (id: string) => {
    if (Platform.OS === "web") return;
    setActiveMealId(id);
    setShowTimePicker(true);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event?.type !== "dismissed" && selectedDate && activeMealId) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      updateMeal(activeMealId, "time", formattedTime);
    }
  };

  const getTimeAsDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date;
  };

  const handleWebTimeChange = (id: string, text: string) => {
    const cleaned = text.replace(/[^\d:]/g, "").slice(0, 5);
    updateMeal(id, "time", cleaned);
  };

  const handleTimeBlur = (id: string, value: string) => {
    if (!isValidTime(value)) {
      Alert.alert("เวลาไม่ถูกต้อง", "กรุณากรอกเวลาเป็นรูปแบบ HH:MM เช่น 08:30");
      updateMeal(id, "time", "12:00");
    }
  };

  const handleFinish = async () => {
    const hasInvalidTime = meals.some((meal) => !isValidTime(meal.time));

    if (hasInvalidTime) {
      Alert.alert("เวลาไม่ถูกต้อง", "กรุณาตรวจสอบเวลาของทุกมื้อให้อยู่ในรูปแบบ HH:MM");
      return;
    }

    updateForm({
      mealTimes: meals as any,
    });

    const result = await scheduleMealNotifications(meals);

    if (!result.ok && result.reason === "permission_denied") {
      Alert.alert(
        "ยังไม่ได้รับสิทธิ์แจ้งเตือน",
        "ระบบบันทึกเวลามื้ออาหารแล้ว แต่ยังไม่สามารถเปิดการแจ้งเตือนได้ กรุณาอนุญาตการแจ้งเตือนในเครื่อง"
      );
    } else {
      Alert.alert("บันทึกสำเร็จ", "ตั้งเวลาและแจ้งเตือนมื้ออาหารเรียบร้อย");
    }

    router.push("/register/summary" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>9.เวลามื้ออาหาร</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>

        <Text style={styles.subtitle}>จำนวนมื้ออาหารที่รับประทานต่อวัน</Text>

        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{mealCount} มื้อ</Text>
            <Ionicons
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={24}
              color="#000"
            />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectCount(num)}
                >
                  <Text style={styles.dropdownItemText}>{num} มื้อ</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⏳</Text>
          <Text style={styles.sectionTitle}>เวลามื้ออาหาร</Text>
        </View>

        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {/* 🚀 เพิ่มถังขยะข้างๆ ชื่อมื้ออาหาร */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.cardTitle}>{meal.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveMeal(meal.id)} style={{ marginLeft: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>เปิดการแจ้งเตือนมื้อนี้</Text>
                <Switch
                  trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                  thumbColor="#FFF"
                  onValueChange={(val) => updateMeal(meal.id, "notify", val)}
                  value={meal.notify}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ชื่อมื้อ</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={meal.name}
                    onChangeText={(text) => updateMeal(meal.id, "name", text)}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                {/* 🚀 เปลี่ยนคำว่า เวลา เป็น เริ่มเวลา */}
                <Text style={styles.inputLabel}>เริ่มเวลา</Text>

                {Platform.OS === "web" ? (
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      value={meal.time}
                      onChangeText={(text) => handleWebTimeChange(meal.id, text)}
                      onBlur={() => handleTimeBlur(meal.id, meal.time)}
                      placeholder="08:30"
                      placeholderTextColor="#888"
                      maxLength={5}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inputBox}
                    onPress={() => openPicker(meal.id)}
                  >
                    <Text style={styles.timeText}>{meal.time}</Text>
                    <Ionicons name="time" size={20} color="#000" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* 🚀 ปุ่มเพิ่มมื้ออาหารแทรกตรงนี้! */}
        <TouchableOpacity style={styles.addMealBtn} onPress={handleAddMeal}>
          <Ionicons name="add-circle-outline" size={20} color={ORANGE} />
          <Text style={styles.addMealBtnText}>เพิ่มมื้ออาหาร</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/register/step8" as any)}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleFinish}>
            <Text style={styles.saveText}>เสร็จสิ้น</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Platform.OS !== "web" && showTimePicker && activeMealId && (
        <DateTimePicker
          value={getTimeAsDate(
            meals.find((m) => m.id === activeMealId)?.time || "12:00"
          )}
          mode="time"
          is24Hour
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

