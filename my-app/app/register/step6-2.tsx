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

// สีเขียวแบบ iOS แท้ๆ
const IOS_GREEN = "#34C759"; 

// 1. Mock Data
const MOCK_VEG = [
  { id: "v1", name: "มะเขือเทศ" },
  { id: "v2", name: "แตงกวา" },
  { id: "v3", name: "แครอท" },
];

const MOCK_CONDIMENT = [
  { id: "c1", name: "ผงชูรส" },
  { id: "c2", name: "ซีอิ๊วขาว" },
  { id: "c3", name: "น้ำปลา" },
];

const MOCK_MEAT = [
  { id: "m1", name: "เนื้อวัว" },
  { id: "m2", name: "เนื้อหมู" },
  { id: "m3", name: "เนื้อไก่" },
];

export default function RegisterStep6OtherScreen() {
  const [isOpenVeg, setIsOpenVeg] = useState(false);
  const [isOpenCondiment, setIsOpenCondiment] = useState(false);
  const [isOpenMeat, setIsOpenMeat] = useState(false);

  // 2. State เก็บค่า ID
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const toggleSwitch = (id: string) => {
    if (selectedAllergies.includes(id)) {
      setSelectedAllergies(selectedAllergies.filter((item) => item !== id));
    } else {
      setSelectedAllergies([...selectedAllergies, id]);
    }
  };

  // 3. Render List 
  const renderList = (data: { id: string; name: string }[]) => {
    return (
      <View style={styles.listContainer}>
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          const isEnabled = selectedAllergies.includes(item.id);

          return (
            <View
              key={item.id}
              style={[styles.listItem, !isLast && styles.listItemBorder]}
            >
              <Text style={styles.listItemText}>{item.name}</Text>
              <Switch
                // ปรับสีแบบ iOS
                trackColor={{ false: "#E9E9EA", true: IOS_GREEN }} 
                thumbColor={"#FFF"}
                ios_backgroundColor="#E9E9EA"
                onValueChange={() => toggleSwitch(item.id)}
                value={isEnabled}
              />
            </View>
          );
        })}
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
        <Text style={styles.stepTitle}>6. อาการแพ้อาหาร</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "75%" }]} />
        </View>

        <Text style={styles.subtitle}>อาหารที่แพ้เพิ่มเติม</Text>

        {/* --- ปุ่มที่ 1: ผักและผลไม้ --- */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.8}
            onPress={() => setIsOpenVeg(!isOpenVeg)}
          >
            <View style={styles.dropdownLeft}>
              <Text style={styles.emojiIcon}>🥦</Text>
              <Text style={styles.dropdownText}>ผักและผลไม้</Text>
            </View>
            <Ionicons
              name={isOpenVeg ? "caret-up" : "caret-down"}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
          {isOpenVeg && renderList(MOCK_VEG)}
        </View>

        {/* --- ปุ่มที่ 2: เครื่องปรุง/ส่วนผสม --- */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.8}
            onPress={() => setIsOpenCondiment(!isOpenCondiment)}
          >
            <View style={styles.dropdownLeft}>
              <Text style={styles.emojiIcon}>🧂</Text>
              <Text style={styles.dropdownText}>เครื่องปรุง/ส่วนผสม</Text>
            </View>
            <Ionicons
              name={isOpenCondiment ? "caret-up" : "caret-down"}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
          {isOpenCondiment && renderList(MOCK_CONDIMENT)}
        </View>

        {/* --- ปุ่มที่ 3: เนื้อสัตว์และโปรตีน --- */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.8}
            onPress={() => setIsOpenMeat(!isOpenMeat)}
          >
            <View style={styles.dropdownLeft}>
              <Text style={styles.emojiIcon}>🥩</Text>
              <Text style={styles.dropdownText}>เนื้อสัตว์และโปรตีน</Text>
            </View>
            <Ionicons
              name={isOpenMeat ? "caret-up" : "caret-down"}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
          {isOpenMeat && renderList(MOCK_MEAT)}
        </View>

        <View style={styles.spacer} />

        {/* --- ปุ่ม ย้อนกลับ / บันทึก --- */}
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
              console.log("ข้อมูลที่เตรียมส่งหลังบ้าน:", selectedAllergies);
              router.push("/register/step7" as any);
            }}
          >
            <Text style={styles.saveText}>บันทึก</Text>
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
    width: "75%",
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },

  dropdownWrapper: {
    marginBottom: 16,
  },
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // เพิ่ม elevation ให้ปุ่มหลักนิดนึง
    zIndex: 2, 
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiIcon: {
    fontSize: 22,
  },
  dropdownText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 12,
  },

  /* --- สไตล์กล่อง List แบบมีเงาชัดเจน --- */
  listContainer: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16, 
    paddingBottom: 8,
    marginTop: -12, 
    // ปรับเงาให้ชัดขึ้น
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, // เข้มขึ้น
    shadowRadius: 8, // กระจายกว้างขึ้น
    elevation: 4, // สำหรับ Android
    zIndex: 1,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
  },

  spacer: {
    flex: 1,
    minHeight: 100,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  backText: { fontWeight: "900", color: "#222" },
  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  saveText: { color: "#fff", fontWeight: "900" },
});