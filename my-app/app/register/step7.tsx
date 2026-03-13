import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const IOS_GREEN = "#34C759";

// สีสลับแถวสำหรับหน้าหมวดหมู่
const ROW_COLOR_1 = "#EBA032"; 
const ROW_COLOR_2 = "#DF9226"; 

// 🔴 [BACKEND TODO]: อนาคตลบ Mock ตัวนี้ทิ้ง แล้วใช้ useEffect ไป fetch ข้อมูลหมวดหมู่อาหาร (Categories) จาก Database
const MOCK_CATEGORIES = [
  { id: "c1", name: "ถั่วเปลือกแข็ง" },
  { id: "c2", name: "ผลิตภัณฑ์นม" },
  { id: "c3", name: "เนื้อสัตว์" },
  { id: "c4", name: "ปลาและอาหารทะเล" },
  { id: "c5", name: "ไข่และชีส" },
  { id: "c6", name: "ขนมปัง" },
  { id: "c7", name: "ขนมหวานและน้ำตาล" },
  { id: "c8", name: "ผลไม้และผัก" },
];

// 🔴 [BACKEND TODO]: อนาคตดึงข้อมูลอาหารย่อย (Items) ตามหมวดหมู่ที่ผู้ใช้กดเลือกจาก API
const MOCK_ITEMS: Record<string, { id: string; name: string }[]> = {
  c1: [
    { id: "n1", name: "ลูกโอ๊ค" },
    { id: "n2", name: "อัลมอนด์" },
    { id: "n3", name: "ถั่วบัตเตอร์นัท" },
    { id: "n4", name: "เม็ดมะม่วงหิมพานต์" },
    { id: "n5", name: "เกาลัด" },
    { id: "n6", name: "เฮเซลนัท" },
    { id: "n7", name: "แมคคาเดเมีย" },
    { id: "n8", name: "ถั่วรวม" },
  ],
  c2: [
    { id: "m1", name: "นมวัว" },
    { id: "m2", name: "เนย" },
  ],
};

export default function RegisterStep7Screen() {
  // 🔴 [BACKEND TODO]: State ตัวนี้คือสิ่งที่เราจะต้องส่งค่า (Array ของ ID อาหารที่ไม่กิน) กลับไปให้ Database
  const [selectedDislikes, setSelectedDislikes] = useState<string[]>([]);
  
  // State ควบคุมว่าจะโชว์หน้าหมวดหมู่ หรือหน้าย่อย (ถ้า null = โชว์หมวดหมู่)
  const [activeCategory, setActiveCategory] = useState<{ id: string; name: string } | null>(null);

  // ฟังก์ชันเปิด-ปิดสวิตช์
  const toggleSwitch = (id: string) => {
    if (selectedDislikes.includes(id)) {
      setSelectedDislikes(selectedDislikes.filter((item) => item !== id));
    } else {
      setSelectedDislikes([...selectedDislikes, id]);
    }
  };

  // --- มุมมองที่ 1: รายการหมวดหมู่ (สีส้ม มีลูกศร) ---
  const renderCategoryList = () => (
    <View style={styles.listWrapper}>
      {MOCK_CATEGORIES.map((cat, index) => (
        <TouchableOpacity
          key={cat?.id || index}
          style={[
            styles.rowItem,
            { backgroundColor: index % 2 === 0 ? ROW_COLOR_1 : ROW_COLOR_2 },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveCategory(cat)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
            <Text style={styles.rowText}>{cat?.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // --- มุมมองที่ 2: รายการอาหารย่อยพร้อมสวิตช์ (พื้นขาว ไม่มีลูกศร) ---
  const renderItemList = () => {
    if (!activeCategory) return null; // กันแอปพังถ้าไม่มีข้อมูลหมวดหมู่

    const items = MOCK_ITEMS[activeCategory.id] || [];

    return (
      <View style={styles.listWrapper}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีข้อมูลในหมวดหมู่นี้</Text>
        ) : (
          items.map((item, index) => {
            const isEnabled = selectedDislikes.includes(item?.id);
            return (
              <View
                key={item?.id || index}
                style={styles.subItemRow}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.subItemText}>•  {item?.name}</Text>
                </View>
                <Switch
                  trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                  thumbColor={"#FFF"}
                  ios_backgroundColor="#E9E9EA"
                  onValueChange={() => toggleSwitch(item?.id)}
                  value={isEnabled}
                />
              </View>
            );
          })
        )}
      </View>
    );
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
        <Text style={styles.stepTitle}>7. อาหารที่ไม่ชอบ/ไม่กิน</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "85%" }]} />
        </View>

        <Text style={styles.subtitle}>
          {activeCategory ? activeCategory.name : "ประเภทอาหารที่ไม่กิน"}
        </Text>

        {/* สลับการแสดงผลตาม State */}
        {activeCategory ? renderItemList() : renderCategoryList()}

        <View style={styles.spacer} />

        {/* --- ปุ่มล่าง --- */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (activeCategory) {
                // ถ้าอยู่หน้าย่อย กดกลับมาหน้าหมวดหมู่
                setActiveCategory(null);
              } else {
                // ถ้าอยู่หน้าหมวดหมู่ กดกลับไป Step 6
                router.back();
              }
            }}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              if (activeCategory) {
                // ถ้าอยู่หน้าย่อย กด 'ถัดไป' เพื่อยืนยันและกลับมาหน้าหมวดหมู่
                setActiveCategory(null);
              } else {
                // ถ้าอยู่หน้าหมวดหมู่ กด 'ถัดไป' ไปหน้า 8 ต่อ
                // 🔴 [BACKEND TODO]: ยิง API เพื่อบันทึกข้อมูล selectedDislikes
                console.log("ข้อมูลที่ไม่กิน (ID) เตรียมส่ง DB:", selectedDislikes);
                router.push("/register/step8" as any);
              }
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
    width: "85%",
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
  listWrapper: {
    borderRadius: 12,
    overflow: "hidden", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  /* --- สไตล์กล่องรายการหมวดหมู่ --- */
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 12,
  },

  /* --- สไตล์สำหรับหน้ารายการย่อย (Checklist) --- */
  subItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  subItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginLeft: 4,
  },

  emptyText: {
    padding: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    backgroundColor: "#FFF",
  },
  spacer: {
    flex: 1,
    minHeight: 80,
  },
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