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

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const CARD_BG = "#FDF8EA";
const IOS_GREEN = "#34C759";

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
          id: String(i + 1),
          name:
            i === 0
              ? "เช้า"
              : i === 1
              ? "กลางวัน"
              : i === 2
              ? "เย็น"
              : i === 3
              ? "ของว่าง"
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
              <Text style={styles.cardTitle}>{meal.name}</Text>
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
                <Text style={styles.inputLabel}>เวลา</Text>

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
    flexGrow: 1,
  },

  stepTitle: { fontSize: 26, fontWeight: "900" },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  dropdownText: { fontSize: 18, fontWeight: "700", color: "#222" },

  dropdownList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  dropdownItemText: { fontSize: 16, fontWeight: "600", color: "#333" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionIcon: { fontSize: 24, marginRight: 8 },

  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#222" },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5D9B7",
  },

  cardHeader: { marginBottom: 12 },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
    marginBottom: 8,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  switchLabel: { fontSize: 14, color: "#444", fontWeight: "500" },

  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  inputWrapper: { flex: 1 },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D4D4D4",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },

  timeText: {
    fontSize: 16,
    color: "#222",
  },

  spacer: { flex: 1, minHeight: 60 },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  backButton: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  backText: { fontWeight: "900", color: "#222", fontSize: 16 },

  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  saveText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});