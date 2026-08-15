import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text"; 
import { styles, GREEN, ORANGE } from "@/style/cart.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/config";
const INITIAL_CART: any[] = []; 


export default function MealCartScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState(INITIAL_CART);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useLocalSearchParams();

  const [availableMeals, setAvailableMeals] = useState<string[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<string>("มื้ออาหาร");

  // 🟢 State สำหรับควบคุม Custom Alert ด้านบนแอป
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100)); // เริ่มต้นซ่อนไว้เหนือขอบจอ -100

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

  useEffect(() => {
    const fetchCartContext = async () => {
      if (!userId) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        // ดึงเวลาปัจจุบันแบบ HH:MM
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // ในไฟล์ app/cart.tsx ตรง useEffect
      const res = await fetch(`${API_BASE_URL}/meal-logs/cart?user_id=${userId}&date=${today}&current_time=${currentTime}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          setAvailableMeals(json.data.available_meals);
          setSelectedMealType(json.data.default_meal); // เลือกมื้อให้ตรงตามเวลาปัจจุบันทันที!
        }
      } catch (error) {
        console.error("Failed to fetch cart context", error);
      }
    };
    fetchCartContext();
  }, [userId]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("currentUser");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const resolvedId = userData.user_id || userData.id; 
          console.log("Cart User ID:", resolvedId); 
          console.log("Cart Screen - ดึง User ID สำเร็จแล้ว ได้ไอดีเป็น:", resolvedId);
          
          if (resolvedId) {
            setUserId(resolvedId);
          }
        }
      } catch (e) {
        console.error("Error fetching user from storage:", e);
      }
    };
    fetchUser();
  }, []);

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

    if (!userId) {
      Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาลองเข้าสู่ระบบใหม่อีกครั้งเพื่อยืนยันตัวตน");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0]; 

      const requestBody = {
        userId: userId,
        user_id: userId,
        items: cartItems,
        date: today,             
        meal_type: selectedMealType, // 👈 ใช้ตัวแปรนี้แทน!
        mealType: selectedMealType      
      };

      const response = await fetch(`${API_BASE_URL}/meal-logs/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody), 
      });

      if (response.ok) {
        // 🟢 สั่งให้แสดงผล Custom Alert ตกลงมาจากด้านบนจอทันทีกระทบฝั่งเว็บ
        setShowSuccessToast(true);
        Animated.timing(slideAnim, {
          toValue: 20, // เลื่อนลงมาห่างจากขอบด้านบน 20px
          duration: 400,
          useNativeDriver: false,
        }).start();

        // เคลียร์ตะกร้าอาหาร
        setCartItems([]);

        // หน่วงเวลาให้ผู้ใช้เห็นแจ้งเตือนฟิน ๆ 1.5 วินาทีแล้วเด้งไปหน้า Dashboard
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100, // เลื่อนกล่องกลับขึ้นไปซ่อนเหมือนเดิม
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            setShowSuccessToast(false);
            router.replace("/(tabs)/dashboard"); // เร่งเด้งกลับหน้าหลักแดชบอร์ดอย่างปลอดภัย
          });
        }, 1500);

      } else {
        const errorData = await response.text();
        console.error("Backend Error Detail:", errorData);
        Alert.alert("ข้อผิดพลาด", `ไม่สามารถเซฟข้อมูลลงระบบได้ (Status: ${response.status})`);
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
      
      {/* 🟢 ส่วน Custom Alert แจ้งเตือนด้านบนจอ (สร้างแบบอนิเมชัน สไลด์ตกจากฟ้า) */}
      {showSuccessToast && (
        <Animated.View style={[localStyles.toastContainer, { top: slideAnim }]}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <ThemedText style={localStyles.toastText}>บันทึกมื้ออาหารสำเร็จแล้วครับ!</ThemedText>
        </Animated.View>
      )}

      {/* แถบหัวข้อบนสุดคงสีขาวเดิม */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.textWhite}>ตะกร้าอาหาร</ThemedText>
      </View>

      {/* 🟢 Header พร้อมปุ่มกลับ */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')} style={{ padding: 4 }}>
          <Ionicons name="close" size={28} color="#111" />
        </TouchableOpacity>
        <ThemedText type="title" style={{ flex: 1, textAlign: 'center', fontSize: 18 }}>ตะกร้ามื้ออาหาร</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 🟢 การ์ดใบที่ 1: รายการอาหารในตะกร้า & แคลอรี่รวม */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryTitleWrap}>
            <ThemedText type="subtitle" style={styles.textBlackBold}>รายการและพลังงานรวม</ThemedText>
          </View>

          {/* 🎯 [เพิ่มใหม่] แถบปุ่มเลือกมื้ออาหารสุดสมาร์ทดึงจากหลังบ้าน */}
          <View style={{ marginVertical: 8, paddingHorizontal: 4 }}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 8, color: "#555", fontSize: 14 }}>
              เลือกมื้อที่จะบันทึก:
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {availableMeals.map((meal) => {
                const isSelected = selectedMealType === meal;
                return (
                  <TouchableOpacity
                    key={meal}
                    onPress={() => setSelectedMealType(meal)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: isSelected ? GREEN : "#ccc",
                      backgroundColor: isSelected ? "#e8f5e9" : "#fff",
                    }}
                  >
                    <ThemedText
                      style={{
                        color: isSelected ? GREEN : "#666",
                        fontWeight: isSelected ? "900" : "600",
                        fontSize: 14,
                      }}
                    >
                      มื้อ{meal}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
              
              {/* กรณีที่วันนี้บันทึกทานครบหมดทุกมื้อแล้ว */}
              {availableMeals.length === 0 && (
                <ThemedText style={{ color: "#FF3B30", fontWeight: "700", fontSize: 13, marginTop: 4 }}>
                  ⚠️ บันทึกมื้ออาหารของวันนี้ครบถ้วนแล้วครับ
                </ThemedText>
              )}
            </View>
          </View>

          <View style={{ alignItems: "center", marginVertical: 14, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 12 }}>
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

        {/* 🟢 การ์ดใบที่ 2: รายละเอียดสารอาหาร */}
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

// 🟢 สไตล์เฉพาะกิจสำหรับ Custom Toast แจ้งเตือนด้านบนจอแอป
const localStyles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#2e7d32", // สีเขียวเข้มสัญลักษณ์ความสำเร็จ
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    zIndex: 9999, // ดึงให้อยู่ชั้นบนสุดของทุกองค์ประกอบ
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)", // ใส่เงาให้กล่องลอยเด่นขึ้นมาบนระบบเว็บและโมบายล์
    elevation: 5,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  }
});