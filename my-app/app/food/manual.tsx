import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ManualFoodScreen() {
  const [form, setForm] = useState({ name: "", protein: "", carb: "", fat: "" });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(["ไข่", "หมู", "ไก่", "มะเขือเทศ"]);

  const categories = [
    {
      id: "veggie",
      title: "ผักและผลไม้",
      items: ["มะเขือเทศ", "ผักกาด", "แครอท", "แอปเปิ้ล", "กล้วย"],
      icon: "leaf",
      color: "#4CAF50"
    },
    {
      id: "seasoning",
      title: "เครื่องปรุง / ส่วนผสม",
      items: ["น้ำปลาม", "ซีอิ๊วขาว", "น้ำตาล", "เกลือ", "ผงปรุงรส"],
      icon: "beaker-outline",
      color: "#FF9800"
    },
    {
      id: "meat",
      title: "เนื้อสัตว์และโปรตีน",
      items: ["หมู", "ไก่", "เนื้อวัว", "ไข่", "ปลา"],
      icon: "food-drumstick",
      color: "#F44336"
    },
  ];

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const toggleIngredient = (item: string) => {
    if (selectedIngredients.includes(item)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== item));
    } else {
      setSelectedIngredients([...selectedIngredients, item]);
    }
  };

  const handleSave = () => {
    if (!form.name) return Alert.alert("เตือน", "กรุณากรอกชื่อเมนูอาหาร");
    Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว");
    router.replace("/(tabs)/record");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บันทึกด้วยตนเอง</Text>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={24} color="#3F66D6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ชื่อเมนู */}
        <Text style={styles.sectionLabel}>ชื่อเมนู</Text>
        <View style={styles.nameInputWrapper}>
          <TextInput
            style={styles.nameInput}
            placeholder="กรุณากรอกชื่อเมนู..."
            placeholderTextColor="#999"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <TouchableOpacity style={styles.cameraIconBtn}>
            <Ionicons name="camera" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ส่วนโภชนาการ - จัดวางตามคำแนะนำ (1 บน, 2 ล่าง) */}
        <View style={styles.nutritionHeader}>
          <MaterialCommunityIcons name="chart-donut" size={26} color="#00E676" />
          <Text style={styles.nutritionTitle}>โภชนาการ</Text>
        </View>

        <View style={styles.nutritionGrid}>
          {/* แถวที่ 1: โปรตีน (Full Width) */}
          <View style={[styles.nutCard, styles.cardRed, { width: '100%' }]}>
            <Text style={styles.nutLabel}>โปรตีน (กรัม)</Text>
            <View style={styles.innerInputBox}>
              <TextInput 
                style={styles.nutInput} 
                keyboardType="numeric" 
                placeholder="0"
                onChangeText={(v) => setForm({ ...form, protein: v })}
              />
            </View>
          </View>

          {/* แถวที่ 2: ไขมัน และ คาร์โบไฮเดรต (วางคู่กัน) */}
          <View style={styles.nutRow}>
            <View style={[styles.nutCard, styles.cardYellow, { flex: 1 }]}>
              <Text style={styles.nutLabel}>ไขมัน (กรัม)</Text>
              <View style={styles.innerInputBox}>
                <TextInput 
                  style={styles.nutInput} 
                  keyboardType="numeric" 
                  placeholder="0"
                  onChangeText={(v) => setForm({ ...form, fat: v })}
                />
              </View>
            </View>

            <View style={[styles.nutCard, styles.cardBlue, { flex: 1 }]}>
              <Text style={styles.nutLabel}>คาร์โบไฮเดรต (กรัม)</Text>
              <View style={styles.innerInputBox}>
                <TextInput 
                  style={styles.nutInput} 
                  keyboardType="numeric" 
                  placeholder="0"
                  onChangeText={(v) => setForm({ ...form, carb: v })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ส่วนเพิ่มส่วนผสม */}
        <View style={styles.ingredientHeader}>
          <Text style={styles.sectionLabel}>เพิ่มส่วนผสม</Text>
        </View>

        <View style={styles.ingredientsSummaryBox}>
           <View style={styles.tagRow}>
              {selectedIngredients.map((item, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                  <TouchableOpacity onPress={() => toggleIngredient(item)}>
                    <Ionicons name="close-circle" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
           </View>
        </View>

        {/* Dropdown Lists */}
        <View style={styles.dropdownContainer}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.accordionItem, expandedCategory === cat.id && { borderColor: cat.color }]}>
              <TouchableOpacity 
                style={styles.accordionHeader} 
                onPress={() => toggleCategory(cat.id)}
              >
                <View style={styles.accordionHeaderLeft}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                  <Text style={styles.accordionTitle}>{cat.title}</Text>
                </View>
                <Ionicons name={expandedCategory === cat.id ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>

              {expandedCategory === cat.id && (
                <View style={styles.accordionContent}>
                  {cat.items.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.itemRow} onPress={() => toggleIngredient(item)}>
                      <Text style={[styles.itemLabel, selectedIngredients.includes(item) && { color: cat.color, fontWeight: '700' }]}>{item}</Text>
                      {selectedIngredients.includes(item) && <Ionicons name="checkmark-circle" size={20} color={cat.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FBFBFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#000" },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },
  sectionLabel: { fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 10 },
  
  nameInputWrapper: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  cameraIconBtn: {
    backgroundColor: "#3F66D6",
    padding: 14,
    borderRadius: 12,
  },

  nutritionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 30, marginBottom: 15 },
  nutritionTitle: { fontSize: 20, fontWeight: "800" },
  
  nutritionGrid: { gap: 12 },
  nutRow: { flexDirection: "row", gap: 12 },
  nutCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardRed: { borderColor: "#FF5252" },
  cardYellow: { borderColor: "#FFD600" },
  cardBlue: { borderColor: "#448AFF" },
  nutLabel: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 12 },
  innerInputBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 8,
  },
  nutInput: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#000" },

  ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  ingredientsSummaryBox: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 15,
    padding: 15,
    minHeight: 85,
    backgroundColor: "#FFF",
    position: 'relative',
  },
  dropdownIconInside: { position: 'absolute', right: 12, top: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#F5F5F5', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  tagText: { fontSize: 13, fontWeight: '700' },

  dropdownContainer: { marginTop: 15, gap: 10 },
  accordionItem: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 15,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA'
  },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  accordionContent: {
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0'
  },
  itemLabel: { fontSize: 15, color: '#444' },

  saveBtn: {
    backgroundColor: "#FFB300",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 40,
    elevation: 5,
    shadowColor: "#FFB300",
    shadowOpacity: 0.3,
  },
  saveBtnText: { color: "#FFF", fontSize: 22, fontWeight: "900" },
});