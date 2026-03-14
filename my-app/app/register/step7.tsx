import React, { useMemo, useState } from "react";
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
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const IOS_GREEN = "#34C759";

// สีสลับแถวสำหรับหน้าหมวดหมู่
const ROW_COLOR_1 = "#EBA032";
const ROW_COLOR_2 = "#DF9226";

// หมวดหมู่อาหาร
const MOCK_CATEGORIES = [
  { id: "c1", name: "ถั่วเปลือกแข็ง" },
  { id: "c2", name: "ผลิตภัณฑ์นม" },
  { id: "c3", name: "เนื้อสัตว์" },
  { id: "c4", name: "ปลาและอาหารทะเล" },
  { id: "c5", name: "ไข่และชีส" },
  { id: "c6", name: "ขนมปัง" },
  { id: "c7", name: "ขนมหวานและน้ำตาล" },
  { id: "c8", name: "ผลไม้และผัก" },
  { id: "c9", name: "ผลเบอร์รี่" },
  { id: "c10", name: "ถั่วและพืช" },
  { id: "c11", name: "เห็ด" },
  { id: "c12", name: "ปราศจากนม (วีแกน)" },
  { id: "c13", name: "น้ำมัน" },
  { id: "c14", name: "แอลกอฮอล์" },
];

// รายการอาหารย่อย
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
    { id: "n9", name: "ลูกจันทน์เทศ" },
    { id: "n10", name: "ถั่วสอง" },
    { id: "n11", name: "พีแคน" },
    { id: "n12", name: "เมล็ดสน (ปินคอน)" },
    { id: "n13", name: "ถั่วพิสตาชิโอ" },
    { id: "n14", name: "วอลนัท" },
  ],
  c2: [
    { id: "m1", name: "นมวัว" },
    { id: "m2", name: "นมแพะ" },
    { id: "m3", name: "โยเกิร์ต" },
    { id: "m4", name: "นมเปรี้ยว" },
    { id: "m5", name: "เนย" },
    { id: "m6", name: "ครีม" },
    { id: "m7", name: "นมข้น" },
    { id: "m8", name: "ชีส" },
  ],
  c3: [
    { id: "me1", name: "เนื้อวัว" },
    { id: "me2", name: "เนื้อหมู" },
    { id: "me3", name: "เนื้อไก่" },
    { id: "me4", name: "เนื้อเป็ด" },
    { id: "me5", name: "เนื้อแกะ" },
    { id: "me6", name: "เนื้อแพะ" },
    { id: "me7", name: "เครื่องในสัตว์" },
  ],
  c4: [
    { id: "s1", name: "ปลาแซลมอน" },
    { id: "s2", name: "ปลาทู" },
    { id: "s3", name: "ปลานิล" },
    { id: "s4", name: "ปลาหมึก" },
    { id: "s5", name: "กุ้ง" },
    { id: "s6", name: "ปู" },
    { id: "s7", name: "หอยแมลงภู่" },
    { id: "s8", name: "หอยนางรม" },
  ],
  c5: [
    { id: "e1", name: "ไข่ไก่" },
    { id: "e2", name: "ไข่เป็ด" },
    { id: "e3", name: "ไข่นกกระทา" },
    { id: "e4", name: "เชดด้าชีส" },
    { id: "e5", name: "มอสซาเรลล่าชีส" },
    { id: "e6", name: "พาเมซานชีส" },
  ],
  c6: [
    { id: "b1", name: "ขนมปังขาว" },
    { id: "b2", name: "ขนมปังโฮลวีต" },
    { id: "b3", name: "ครัวซองต์" },
    { id: "b4", name: "เบเกิล" },
    { id: "b5", name: "บัน" },
    { id: "b6", name: "แซนด์วิช" },
  ],
  c7: [
    { id: "d1", name: "ช็อกโกแลต" },
    { id: "d2", name: "คุกกี้" },
    { id: "d3", name: "เค้ก" },
    { id: "d4", name: "โดนัท" },
    { id: "d5", name: "ไอศกรีม" },
    { id: "d6", name: "ลูกอม" },
    { id: "d7", name: "น้ำตาลทราย" },
    { id: "d8", name: "น้ำผึ้ง" },
  ],
  c8: [
    { id: "fv1", name: "แอปเปิล" },
    { id: "fv2", name: "กล้วย" },
    { id: "fv3", name: "ส้ม" },
    { id: "fv4", name: "มะม่วง" },
    { id: "fv5", name: "แตงโม" },
    { id: "fv6", name: "มะเขือเทศ" },
    { id: "fv7", name: "แตงกวา" },
    { id: "fv8", name: "แครอท" },
    { id: "fv9", name: "บรอกโคลี" },
    { id: "fv10", name: "กะหล่ำปลี" },
  ],
  c9: [
    { id: "ber1", name: "สตรอว์เบอร์รี" },
    { id: "ber2", name: "บลูเบอร์รี" },
    { id: "ber3", name: "ราสป์เบอร์รี" },
    { id: "ber4", name: "แบล็กเบอร์รี" },
    { id: "ber5", name: "แครนเบอร์รี" },
  ],
  c10: [
    { id: "leg1", name: "ถั่วแดง" },
    { id: "leg2", name: "ถั่วเขียว" },
    { id: "leg3", name: "ถั่วเหลือง" },
    { id: "leg4", name: "ลูกเดือย" },
    { id: "leg5", name: "งา" },
    { id: "leg6", name: "เมล็ดเจีย" },
  ],
  c11: [
    { id: "mush1", name: "เห็ดหอม" },
    { id: "mush2", name: "เห็ดเข็มทอง" },
    { id: "mush3", name: "เห็ดฟาง" },
    { id: "mush4", name: "เห็ดออรินจิ" },
  ],
  c12: [
    { id: "vg1", name: "นมอัลมอนด์" },
    { id: "vg2", name: "นมโอ๊ต" },
    { id: "vg3", name: "นมถั่วเหลือง" },
    { id: "vg4", name: "ชีสวีแกน" },
    { id: "vg5", name: "โยเกิร์ตวีแกน" },
  ],
  c13: [
    { id: "oil1", name: "น้ำมันมะกอก" },
    { id: "oil2", name: "น้ำมันรำข้าว" },
    { id: "oil3", name: "น้ำมันปาล์ม" },
    { id: "oil4", name: "น้ำมันถั่วเหลือง" },
    { id: "oil5", name: "น้ำมันงา" },
  ],
  c14: [
    { id: "alc1", name: "เบียร์" },
    { id: "alc2", name: "ไวน์" },
    { id: "alc3", name: "วิสกี้" },
    { id: "alc4", name: "วอดก้า" },
    { id: "alc5", name: "ค็อกเทล" },
  ],
};

const ALL_ITEMS = Object.values(MOCK_ITEMS).flat();

export default function RegisterStep7Screen() {
  const { form, updateForm } = useRegister();

  const initialSelected = useMemo(() => {
    if (!form.dislikedFoods || !Array.isArray(form.dislikedFoods)) return [];
    return ALL_ITEMS.filter((item) => form.dislikedFoods.includes(item.name)).map(
      (item) => item.id
    );
  }, [form.dislikedFoods]);

  const [selectedDislikes, setSelectedDislikes] =
    useState<string[]>(initialSelected);

  const [activeCategory, setActiveCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const toggleSwitch = (id: string) => {
    setSelectedDislikes((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectedDislikedNames = useMemo(() => {
    return ALL_ITEMS.filter((item) => selectedDislikes.includes(item.id)).map(
      (item) => item.name
    );
  }, [selectedDislikes]);

  const handleBack = () => {
    if (activeCategory) {
      setActiveCategory(null);
      return;
    }

    router.replace("/register/step6-2" as any);
  };

  const handleNext = () => {
    if (activeCategory) {
      setActiveCategory(null);
      return;
    }

    updateForm({
      dislikedFoods: selectedDislikedNames,
    });

    console.log("ข้อมูลที่ไม่กิน เตรียมส่ง DB:", selectedDislikedNames);

    router.push("/register/step8" as any);
  };

  const renderCategoryList = () => (
    <View style={styles.listWrapper}>
      {MOCK_CATEGORIES.map((cat, index) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.rowItem,
            { backgroundColor: index % 2 === 0 ? ROW_COLOR_1 : ROW_COLOR_2 },
          ]}
          activeOpacity={0.7}
          onPress={() => setActiveCategory(cat)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
            <Text style={styles.rowText}>{cat.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItemList = () => {
    if (!activeCategory) return null;

    const items = MOCK_ITEMS[activeCategory.id] || [];

    return (
      <View style={styles.listWrapper}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีข้อมูลในหมวดหมู่นี้</Text>
        ) : (
          items.map((item, index) => {
            const isEnabled = selectedDislikes.includes(item.id);
            const isLast = index === items.length - 1;

            return (
              <View
                key={item.id}
                style={[
                  styles.subItemRow,
                  !isLast && styles.subItemRowBorder,
                ]}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.subItemText}>• {item.name}</Text>
                </View>

                <Switch
                  trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                  thumbColor="#FFF"
                  ios_backgroundColor="#E9E9EA"
                  onValueChange={() => toggleSwitch(item.id)}
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
        <Text style={styles.stepTitle}>7.อาหารที่ไม่ชอบ/ไม่กิน</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "85%" }]} />
        </View>

        <Text style={styles.subtitle}>
          {activeCategory ? activeCategory.name : "ประเภทอาหารที่ไม่กิน"}
        </Text>

        {activeCategory ? renderItemList() : renderCategoryList()}

        {!activeCategory && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>รายการที่เลือก</Text>
            <Text style={styles.summaryText}>
              {selectedDislikedNames.length > 0
                ? selectedDislikedNames.join(", ")
                : "-"}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleNext}>
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

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  scroll: { flex: 1 },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
    overflow: "hidden",
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

  listWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

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
    flex: 1,
  },

  rowText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 12,
    flexShrink: 1,
  },

  subItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },

  subItemRowBorder: {
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

  summaryBox: {
    marginTop: 16,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 14,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#6B5A3D",
    marginBottom: 6,
  },

  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "700",
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

  backText: {
    fontWeight: "900",
    color: "#222",
    fontSize: 16,
  },

  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});