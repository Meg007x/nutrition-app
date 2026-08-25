import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, BG, IOS_GREEN, ROW_COLOR_1, ROW_COLOR_2 } from "./step6-2.styles";
import { API_BASE_URL } from "../../constants/config";

export default function RegisterStep6OtherScreen() {
  const { form, updateForm } = useRegister();

  // สถานะโหลดข้อมูล
  const [isLoading, setIsLoading] = useState(true);

  // ข้อมูลตั้งต้นที่รอรับจาก API
  const [vegList, setVegList] = useState<any[]>([]);
  const [condimentList, setCondimentList] = useState<any[]>([]);
  const [meatList, setMeatList] = useState<any[]>([]);

  // State จัดการสิ่งที่ผู้ใช้เลือก
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);

  // สถานะเปิด/ปิด Dropdown
  const [isOpenVeg, setIsOpenVeg] = useState(false);
  const [isOpenCondiment, setIsOpenCondiment] = useState(false);
  const [isOpenMeat, setIsOpenMeat] = useState(false);

  // 🚀 ดึงข้อมูลจาก API เมื่อเปิดหน้านี้
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ingredients`);
        const result = await response.json();
        
        if (result && result.data) {
          // แปลง _id จาก MongoDB ให้เป็น id ธรรมดาที่หน้าบ้านใช้ และรับประกันว่าเป็น string เพื่อการตรวจสอบที่ถูกต้อง
          const formatData = (arr: any[]) => arr.map(item => ({ ...item, id: String(item._id || item.id) }));
          
          const fetchedVeg = formatData(result.data.veg || []);
          const fetchedCond = formatData(result.data.condiment || []);
          const fetchedMeat = formatData(result.data.meat || []);

          // --- ระบบฟื้นฟูข้อมูลเก่าที่ผู้ใช้เคยกรอกไว้ ---
          const safeAllergies: any = form.allergies || {};
          const isOldArray = Array.isArray(safeAllergies);

          const savedVeg = isOldArray ? [] : (safeAllergies.veg || []);
          const savedCond = isOldArray ? [] : (safeAllergies.condiment || []);
          const savedMeat = isOldArray ? [] : (safeAllergies.meat || []);
          const savedOther = isOldArray ? safeAllergies : (safeAllergies.other || []);

          const initCategory = (apiData: any[], savedData: string[], prefix: string) => {
            const list = [...apiData];
            const selected: string[] = [];
            const knownNames = apiData.map(m => m.name);

            savedData.forEach((name, i) => {
              if (!knownNames.includes(name)) {
                const newId = `custom_${prefix}_${Date.now()}_${i}`;
                list.push({ id: newId, name });
                selected.push(newId);
              } else {
                const found = list.find(m => m.name === name);
                if (found) selected.push(found.id);
              }
            });
            return { list, selected };
          };

          const initialVeg = initCategory(fetchedVeg, savedVeg, 'veg');
          const initialCond = initCategory(fetchedCond, savedCond, 'condiment');
          const initialMeat = initCategory(fetchedMeat, savedMeat, 'meat');

          setVegList(initialVeg.list);
          setCondimentList(initialCond.list);
          setMeatList(initialMeat.list);

          setSelectedAllergies([
            ...initialVeg.selected,
            ...initialCond.selected,
            ...initialMeat.selected
          ]);

          setCustomAllergies(
            savedOther.filter((name: string) =>
              !fetchedVeg.map(m => m.name).includes(name) &&
              !fetchedCond.map(m => m.name).includes(name) &&
              !fetchedMeat.map(m => m.name).includes(name)
            )
          );
        }
      } catch (error) {
        console.error("Fetch Ingredients Error:", error);
        Alert.alert("เชื่อมต่อล้มเหลว", "ไม่สามารถดึงข้อมูลวัตถุดิบได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false); // ปิดตัวโหลด
      }
    };

    fetchIngredients();
  }, [form.allergies]);

  const toggleSwitch = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeCustomAllergy = (value: string) => {
    setCustomAllergies((prev) => prev.filter((item) => item !== value));
  };

  const finalVegNames = vegList.filter(item => selectedAllergies.includes(item.id)).map(item => item.name);
  const finalCondimentNames = condimentList.filter(item => selectedAllergies.includes(item.id)).map(item => item.name);
  const finalMeatNames = meatList.filter(item => selectedAllergies.includes(item.id)).map(item => item.name);
  const finalAllergiesFlat = [...finalVegNames, ...finalCondimentNames, ...finalMeatNames, ...customAllergies];

  const handleSaveAndBack = () => {
    // บันทึกข้อมูลแล้วไป step7 เลย ไม่ว่าจะกดจากหน้า 6-1 หรือ 6-2
    const categorizedAllergies = {
      veg: finalVegNames,
      condiment: finalCondimentNames,
      meat: finalMeatNames,
      other: customAllergies
    };

    updateForm({
      hasAllergies: true,
      allergies: categorizedAllergies as any,
    });

    router.push("/register/step7" as any);
  };

  const renderList = (
    data: { id: string; name: string }[],
    category: 'veg' | 'condiment' | 'meat',
  ) => {
    // 🟢 แสดงข้อความเมื่อไม่มีข้อมูลวัตถุดิบในหมวดนี้
    if (data.length === 0) {
      return (
        <View style={styles.listContainer}>
          <View style={[styles.listItem, { justifyContent: 'center', paddingVertical: 18 }]}>
            <Text style={{ fontSize: 14, color: '#999', fontFamily: 'NotoSansThai', textAlign: 'center' }}>
              ยังไม่มีข้อมูลวัตถุดิบในหมวดนี้
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {data.map((item) => {
          const isEnabled = selectedAllergies.includes(item.id);
          return (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name}</Text>
              <Switch
                trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                thumbColor="#FFF"
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

  // 🌀 หน้าจอตอนกำลังโหลดข้อมูลจากหลังบ้าน
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ marginTop: 16, color: "#666", fontFamily: "NotoSansThaiBold" }}>กำลังโหลดข้อมูลวัตถุดิบ...</Text>
      </SafeAreaView>
    );
  }

  const content = (
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
        <Text style={styles.stepTitle}>6. วัตถุดิบที่แพ้</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "75%" }]} />
        </View>

        <Text style={styles.subtitle}>เลือกรายการวัตถุดิบที่คุณแพ้</Text>

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
            <Ionicons name={isOpenVeg ? "caret-up" : "caret-down"} size={20} color="#FFF" />
          </TouchableOpacity>
          {isOpenVeg && renderList(vegList, 'veg')}
        </View>

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
            <Ionicons name={isOpenCondiment ? "caret-up" : "caret-down"} size={20} color="#FFF" />
          </TouchableOpacity>
          {isOpenCondiment && renderList(condimentList, 'condiment')}
        </View>

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
            <Ionicons name={isOpenMeat ? "caret-up" : "caret-down"} size={20} color="#FFF" />
          </TouchableOpacity>
          {isOpenMeat && renderList(meatList, 'meat')}
        </View>

        {customAllergies.length > 0 && (
          <View style={styles.legacyCustomSection}>
            <Text style={styles.legacyCustomTitle}>รายการอื่นๆ ที่เคยบันทึกไว้</Text>
            <View style={styles.customChipWrap}>
              {customAllergies.map((item) => (
                <View key={item} style={styles.customChip}>
                  <Text style={styles.customChipText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => removeCustomAllergy(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.customChipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>รายการที่เลือก</Text>
          <Text style={styles.summaryText}>
            {finalAllergiesFlat.length > 0 ? finalAllergiesFlat.join(", ") : "-"}
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/register/step6-1" as any)}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndBack}>
            <Text style={styles.saveText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (Platform.OS === "web") return content;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}

