import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

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
  // 🔴 [BACKEND TODO]: State เก็บ Array ของ ID อาหารที่ผู้ใช้สนใจ เพื่อเตรียมส่งให้ Database
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // ฟังก์ชันกดเลือก/ยกเลิกการเลือก อาหารที่สนใจ
  const toggleSelection = (id: string) => {
    if (selectedCuisines.includes(id)) {
      setSelectedCuisines(selectedCuisines.filter((item) => item !== id));
    } else {
      setSelectedCuisines([...selectedCuisines, id]);
    }
  };

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
                  isSelected ? styles.cuisineItemSelected : styles.cuisineItemUnselected,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleSelection(cuisine.id)}
              >
                <Text
                  style={[
                    styles.cuisineText,
                    isSelected ? styles.cuisineTextSelected : styles.cuisineTextUnselected,
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
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              // 🔴 [BACKEND TODO]: จุดนี้คือส่งข้อมูลทั้งหมดบันทึกลง Database
              console.log("อาหารที่สนใจ (ID) เตรียมส่ง DB:", selectedCuisines);
              
              // ไปหน้าถัดไป หรือหน้าสรุปผล
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
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginBottom: 16,
  },
  
  /* --- สไตล์กล่องรายการอาหาร --- */
  listContainer: {
    marginTop: 8,
    gap: 12, // ระยะห่างระหว่างปุ่ม
  },
  cuisineItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, 
  },
  // ✅ สถานะที่ยังไม่เลือก (สีส้มทึบ ตาม Mockup)
  cuisineItemUnselected: {
    backgroundColor: "#EBA032",
    borderWidth: 1.5,
    borderColor: "#EBA032",
  },
  // ✅ สถานะตอนที่เลือกแล้ว (พื้นขาว มีขอบส้มบางๆ กันกลืนกับพื้นหลัง)
  cuisineItemSelected: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#EBA032", 
  },
  cuisineText: {
    fontSize: 18,
    fontWeight: "700",
  },
  // ✅ สีตัวหนังสือตอนยังไม่เลือก (สีขาว)
  cuisineTextUnselected: {
    color: "#FFF",
  },
  // ✅ สีตัวหนังสือตอนเลือกแล้ว (สีดำ ตามที่คุณต้องการ)
  cuisineTextSelected: {
    color: "#222", 
  },

  spacer: {
    flex: 1,
    minHeight: 80,
  },
  
  /* --- ปุ่มด้านล่าง --- */
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
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