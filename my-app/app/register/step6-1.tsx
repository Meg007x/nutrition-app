import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

// ลิสต์อาหารที่แพ้
const ALLERGIES = [
  "แพ้ถั่ว",
  "แพ้อาหารทะเล",
  "แพ้นมวัว",
  "แพ้กลูเตน",
  "แพ้ไข่",
  "แพ้แป้งสาลี",
];

export default function RegisterStep6Screen() {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const toggleAllergy = (option: string) => {
    if (option === "ไม่มีอาการแพ้") {
      if (selectedAllergies.includes("ไม่มีอาการแพ้")) {
        setSelectedAllergies([]);
      } else {
        setSelectedAllergies(["ไม่มีอาการแพ้"]);
      }
    } else {
      // เอาคำว่าไม่มีอาการแพ้ออกเมื่อเลือกอย่างอื่น
      let newSelected = selectedAllergies.filter(
        (item) => item !== "ไม่มีอาการแพ้"
      );

      if (newSelected.includes(option)) {
        newSelected = newSelected.filter((item) => item !== option);
      } else {
        newSelected.push(option);
      }
      setSelectedAllergies(newSelected);
    }
  };

  const isSelected = (option: string) => selectedAllergies.includes(option);
  const canGoNext = selectedAllergies.length > 0;

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
          <Text style={styles.stepTitle}>6. อาการแพ้อาหาร</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "75%" }]} />
          </View>

          <Text style={styles.subtitle}>
            คุณมีอาการแพ้อาหารหรือโรคประจำตัวหรือไม่?
          </Text>

          <View style={styles.gridContainer}>
            {ALLERGIES.map((item) => {
              const active = isSelected(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.allergyBtn,
                    active && styles.allergyBtnActive,
                  ]}
                  onPress={() => toggleAllergy(item)}
                >
                  <Text
                    style={[
                      styles.allergyText,
                      active && styles.allergyTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ปุ่มอื่นๆ ปรับขอบส้ม และ ตัวหนังสือสีดำ ตามบรีฟ */}
          <TouchableOpacity
            style={styles.otherBtn}
            onPress={() => router.push("/register/step6-2" as any)}
          >
            <Text style={styles.otherBtnText}>+ อื่นๆ / รายการเพิ่มเติม</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.noneBtn,
              isSelected("ไม่มีอาการแพ้") && styles.noneBtnActive,
            ]}
            onPress={() => toggleAllergy("ไม่มีอาการแพ้")}
          >
            <Text
              style={[
                styles.noneBtnText,
                isSelected("ไม่มีอาการแพ้") && styles.noneBtnTextActive,
              ]}
            >
              ไม่มีอาการแพ้
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            {/* แก้ปุ่มย้อนกลับให้ลิงก์ตรงไปที่ Step 5 */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/register/step5" as any)}
            >
              <Text style={styles.backText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                !canGoNext && styles.nextButtonDisabled,
              ]}
              
              onPress={() => router.push("/register/step7" as any)}
            >
              <Text style={styles.nextText}>ถัดไป</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    marginTop: 18,
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  
  allergyBtn: {
    width: "48%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  allergyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  allergyBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },
  allergyTextActive: {
    color: ORANGE,
  },

  // ปุ่ม อื่นๆ - ตัวหนังสือสีดำ (#333) ตามบรีฟ
  otherBtn: {
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  otherBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333", // เปลี่ยนเป็นสีดำ
  },

  noneBtn: {
    width: "100%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  noneBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },
  noneBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },
  noneBtnTextActive: {
    color: ORANGE,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  backText: { fontWeight: "900", color: "#222" },
  nextButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  nextButtonDisabled: {
    backgroundColor: "#CCC",
  },
  nextText: { color: "#fff", fontWeight: "900" },
});