import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text"; // 👈 กลับมาใช้คอมโพเนนต์ดั้งเดิมของระบบคุณ
import { styles, GREEN, ORANGE } from "@/style/cart.styles";

const API_URL = "http://localhost:3000/api/meal-logs/cart";
const INITIAL_CART: any[] = []; 

export default function MealCartScreen() {
  const [cartItems, setCartItems] = useState(INITIAL_CART);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.newFood) {
      try {
        const parsedFood = JSON.parse(params.newFood as string);
        setCartItems((prev) => [...prev, parsedFood]);
        router.setParams({ newFood: undefined });
      } catch (e) {
        console.error("Error parsing new food:", e);
      }
    }
  }, [params.newFood]);

  const totalKcal = cartItems.reduce((sum, item) => sum + (item.nutrition?.kcal || 0), 0);
  const totalProtein = cartItems.reduce((sum, item) => sum + (item.nutrition?.protein_g || 0), 0);
  const totalCarb = cartItems.reduce((sum, item) => sum + (item.nutrition?.carb_g || 0), 0);
  const totalFat = cartItems.reduce((sum, item) => sum + (item.nutrition?.fat_g || 0), 0);
  const totalFiber = cartItems.reduce((sum, item) => sum + (item.nutrition?.fiber_g || 0), 0);
  const totalSodium = cartItems.reduce((sum, item) => sum + (item.nutrition?.sodium_mg || 0), 0);

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.item_id !== itemId));
  };

  const handleAddMockItem = (type: number) => {
    const mockItem = type === 1 ? {
      item_id: `mock_${Date.now()}`,
      scan_session_id: "",
      source: "scan",
      food_id: "mock_food_01",
      food_name: "ข้าวกะเพราไก่ไข่ดาว (จำลอง)",
      food_name_en: "Stir-fried Basil Chicken with Rice",
      category: "อาหารจานเดียว",
      image_uri: "",
      selected_portion: { display_text: "1 จาน (350 กรัม)", gram: 350, unit: "จาน", multiplier: 1 },
      nutrition: { kcal: 620, protein_g: 28, carb_g: 65, fat_g: 22, fiber_g: 2, sodium_mg: 1200 },
      ingredients: [{ ingredient_id: "ing_01", name: "เนื้อไก่", qty: 100, unit: "กรัม" }]
    } : {
      item_id: `mock_${Date.now()}`,
      scan_session_id: "",
      source: "scan",
      food_id: "mock_food_02",
      food_name: "อกไก่ย่างนุ่ม (จำลอง)",
      food_name_en: "Grilled Chicken Breast",
      category: "โปรตีน",
      image_uri: "",
      selected_portion: { display_text: "1 ชิ้น (150 กรัม)", gram: 150, unit: "ชิ้น", multiplier: 1 },
      nutrition: { kcal: 165, protein_g: 31, carb_g: 0, fat_g: 3, fiber_g: 0, sodium_mg: 380 },
      ingredients: [{ ingredient_id: "ing_02", name: "อกไก่", qty: 150, unit: "กรัม" }]
    };
    setCartItems((prev) => [...prev, mockItem]);
  };

  const handleConfirmMeal = async () => {
    if (cartItems.length === 0) {
      Alert.alert("ตะกร้าว่างเปล่า", "กรุณาเพิ่มอาหารก่อนบันทึก");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });
      if (response.ok) {
        Alert.alert("สำเร็จ", "บันทึกมื้ออาหารเรียบร้อยแล้วครับ!", [
          { text: "ตกลง", onPress: () => router.push("/(tabs)/record") }
        ]);
        setCartItems([]);
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถเซฟข้อมูลลงระบบได้");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* แถบหัวข้อบนสุดคงสีขาวเดิม */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.textWhite}>ตะกร้าอาหาร</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 🟢 การ์ดใบที่ 1: รายการอาหารในตะกร้า & แคลอรี่รวม */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryTitleWrap}>
            <ThemedText type="subtitle" style={styles.textBlackBold}>รายการและพลังงานรวม</ThemedText>
          </View>
          
          <View style={{ alignItems: "center", marginVertical: 14 }}>
            {/* บังคับสีดำสนิทผ่านสไตล์โดยตรง เพื่อแก้ปัญหา ThemedText จาง */}
            <ThemedText type="defaultSemiBold" style={styles.textBlack}>พลังงานที่ได้รับในตะกร้านี้</ThemedText>
            <ThemedText style={styles.calNumberText}>
              {totalKcal} <ThemedText style={{ fontSize: 18, color: ORANGE, fontWeight: "900" }}>kcal</ThemedText>
            </ThemedText>
          </View>

          {cartItems.map((item) => (
            <View key={item.item_id} style={styles.foodCard}>
              <View style={styles.foodInfo}>
                <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{item.food_name}</ThemedText>
                <ThemedText type="default" style={[styles.textBlack, { fontSize: 14, marginTop: 4, fontWeight: "600" }]}>
                  {item.selected_portion?.display_text}
                </ThemedText>
              </View>
              <View style={styles.foodNutrient}>
                <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{item.nutrition.kcal} kcal</ThemedText>
                <TouchableOpacity 
                  onPress={() => handleRemoveItem(item.item_id)}
                  style={{ marginTop: 10, padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {cartItems.length === 0 && (
            <View style={{ paddingVertical: 35, alignItems: "center" }}>
              <Ionicons name="fast-food-outline" size={46} color="#000000" />
              <ThemedText type="defaultSemiBold" style={[styles.textBlackBold, { marginTop: 10 }]}>
                เพิ่มอาหารลงตรงนี้ได้เลยครับ
              </ThemedText>
            </View>
          )}

          {/* ปุ่มสแกนเพิ่มอาหาร (ข้อความสีขาวบนปุ่ม) */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: ORANGE, marginTop: 12 }]} 
            onPress={() => router.push("/(tabs)/scan")}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="scan-outline" size={18} color="#ffffff" />
              <ThemedText type="defaultSemiBold" style={styles.textWhite}>สแกนเพิ่มอาหาร</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🟢 การ์ดใบที่ 2: รายละเอียดสารอาหาร (ใช้หัวข้อและเนื้อหาเป็นสีดำสนิททั้งหมด) */}
        <View style={[styles.summaryBox, { marginTop: 20 }]}>
          <View style={styles.summaryTitleWrap}>
            <ThemedText type="subtitle" style={styles.textBlackBold}>สรุปสารอาหาร</ThemedText>
          </View>
          
          <View style={{ gap: 14, paddingVertical: 6 }}>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold" style={styles.textBlack}>โปรตีน (Protein):</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{totalProtein} กรัม</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold" style={styles.textBlack}>คาร์โบไฮเดรต (Carb):</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{totalCarb} กรัม</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold" style={styles.textBlack}>ไขมัน (Fat):</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{totalFat} กรัม</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold" style={styles.textBlack}>ใยอาหาร (Fiber):</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{totalFiber} กรัม</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="defaultSemiBold" style={styles.textBlack}>โซเดียม (Sodium):</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.textBlackBold}>{totalSodium} มิลลิกรัม</ThemedText>
            </View>
          </View>
        </View>

        {/* 🧪 ส่วนสำหรับผู้พัฒนา (Dev Tools) */}
        <View style={styles.devContainer}>
          <ThemedText type="defaultSemiBold" style={[styles.textBlackBold, { fontSize: 13, textAlign: "center", marginBottom: 8 }]}>
            🛠️ Dev Tools (ปุ่มจำลองสำหรับทดสอบเพิ่มอาหาร)
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
            <TouchableOpacity style={styles.devButton} onPress={() => handleAddMockItem(1)}>
              <ThemedText style={styles.textWhiteSmall}>+ เสกกะเพรา</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devButton} onPress={() => handleAddMockItem(2)}>
              <ThemedText style={styles.textWhiteSmall}>+ เสกอกไก่</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* ปุ่มบันทึกหลักด้านล่าง */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, cartItems.length === 0 && styles.disabledButton]} 
          onPress={handleConfirmMeal} 
          disabled={isSubmitting || cartItems.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.textWhite}>บันทึกรายการอาหาร</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}