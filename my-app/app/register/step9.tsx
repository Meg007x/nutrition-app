import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker"; // ✅ นำเข้าไลบรารีเวลา

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const CARD_BG = "#FDF8EA";
const IOS_GREEN = "#34C759";

// โครงสร้างข้อมูลตั้งต้นของมื้ออาหาร
const INITIAL_MEALS = [
  { id: "1", name: "เช้า", time: "08:30", notify: true },
  { id: "2", name: "กลางวัน", time: "12:30", notify: true },
  { id: "3", name: "เย็น", time: "18:30", notify: true },
];

export default function RegisterStep9Screen() {
  const [mealCount, setMealCount] = useState(3);
  const [meals, setMeals] = useState(INITIAL_MEALS);
  const [showDropdown, setShowDropdown] = useState(false);

  // --- State สำหรับระบบเลือกเวลา ---
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);

  // ฟังก์ชันปรับจำนวนมื้ออาหาร
  const handleSelectCount = (count: number) => {
    setMealCount(count);
    setShowDropdown(false);

    let newMeals = [...meals];
    if (count > meals.length) {
      for (let i = meals.length; i < count; i++) {
        newMeals.push({
          id: (i + 1).toString(),
          name: `มื้อที่ ${i + 1}`,
          time: "12:00",
          notify: true,
        });
      }
    } else if (count < meals.length) {
      newMeals = newMeals.slice(0, count);
    }
    setMeals(newMeals);
  };

  // ฟังก์ชันอัปเดตข้อมูลในการ์ด
  const updateMeal = (id: string, field: string, value: string | boolean) => {
    const updatedMeals = meals.map((meal) =>
      meal.id === id ? { ...meal, [field]: value } : meal
    );
    setMeals(updatedMeals);
  };

  // --- ฟังก์ชันจัดการ Time Picker ---
  const openPicker = (id: string) => {
    setActiveMealId(id);
    setShowTimePicker(true);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    // ปิด Picker เมื่อกดเลือก (เฉพาะ Android, iOS จะเป็นล้อหมุน)
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    // ถ้าไม่ได้กด Cancel และเลือกเวลามา
    if (event.type !== "dismissed" && selectedDate && activeMealId) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      updateMeal(activeMealId, "time", formattedTime);
    }
  };

  // ฟังก์ชันแปลงข้อความ "08:30" กลับเป็นก้อน Date ให้ Picker รู้จัก
  const getTimeAsDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
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
      >
        <Text style={styles.stepTitle}>9.เวลามื้ออาหาร</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>

        <Text style={styles.subtitle}>จำนวนมื้ออาหารที่รับประทานต่อวัน</Text>

        {/* --- Dropdown เลือกจำนวนมื้อ --- */}
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{mealCount} มื้อ</Text>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={24} color="#000" />
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

        {/* --- รายการการ์ดมื้ออาหาร --- */}
        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            {/* หัวการ์ด + สวิตช์ */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{meal.name}</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>ตั้งเวลาเพื่อช่วยการแจ้งเตือน</Text>
                <Switch
                  trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                  thumbColor={"#FFF"}
                  onValueChange={(val) => updateMeal(meal.id, "notify", val)}
                  value={meal.notify}
                />
              </View>
            </View>

            {/* ช่องกรอกข้อมูล */}
            <View style={styles.inputContainer}>
              {/* ซ้าย: ชื่อมื้อ */}
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

              {/* ขวา: เวลา (✅ ปรับให้กดแล้วเด้ง Picker แถมไอคอนไม่ทะลุ) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>เวลา</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.inputBox}
                  onPress={() => openPicker(meal.id)}
                >
                  <Text style={styles.timeText}>{meal.time}</Text>
                  <Ionicons name="time" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.spacer} />

        {/* --- ปุ่มล่าง --- */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              console.log("ตั้งค่ามื้ออาหารเรียบร้อย:", meals);
              alert("บันทึกข้อมูลเรียบร้อย!");
              // router.replace("/home" as any);
            }}
          >
            <Text style={styles.saveText}>เสร็จสิ้น</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- ตัวแสดง Time Picker จะลอยอยู่เหนือหน้าจอ --- */}
      {showTimePicker && activeMealId && (
        <DateTimePicker
          value={getTimeAsDate(meals.find((m) => m.id === activeMealId)?.time || "12:00")}
          mode="time"
          is24Hour={true} // ใช้ระบบ 24 ชั่วโมง
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
  progressFill: { height: "100%", backgroundColor: ORANGE },
  subtitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  /* Dropdown Styles */
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

  /* Section Title */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: { fontSize: 24, marginRight: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#222" },

  /* Card Styles */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5D9B7",
  },
  cardHeader: { marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#000", marginBottom: 8 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { fontSize: 14, color: "#444", fontWeight: "500" },
  
  /* Inputs inside Card */
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 6 },
  
  // ✅ แก้ไขสไตล์กล่องให้เก็บไอคอนไว้ข้างใน
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // ดันให้ Text อยู่ซ้าย ไอคอนอยู่ขวา
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

  /* Bottom Buttons */
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