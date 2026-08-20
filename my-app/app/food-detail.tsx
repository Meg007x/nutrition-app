import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";

import { BASE_URL } from "../constants/config";

type FoodDetail = {
  food_id?: string;
  name?: string;
  image_url?: string;
  category?: string;

  nutrition_per_portion?: {
    kcal?: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };

  ingredients?: Array<{
    name?: string;
    qty?: number | string;
    unit?: string;
  }>;
};

export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{
    foodId?: string;
    mealName?: string;
  }>();

  const foodId = String(params.foodId || "");
  const mealName = String(params.mealName || "");

  const [food, setFood] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"nutrition" | "ingredients">(
    "nutrition"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    loadFoodDetail();
  }, [foodId]);

  async function loadFoodDetail() {
    if (!foodId) {
      setError("ไม่พบรหัสอาหาร");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * เปลี่ยน endpoint ตรงนี้ให้ตรงกับ Backend จริง
       */
      const response = await axios.get(
        `${BASE_URL}/api/foods/${encodeURIComponent(foodId)}`
      );

      const data = response?.data;

      setFood(data?.food || data?.data || data);
    } catch (err: any) {
      console.log(
        "loadFoodDetail error:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.message ||
          "ไม่สามารถโหลดรายละเอียดอาหารได้"
      );
    } finally {
      setLoading(false);
    }
  }

  const nutrition = food?.nutrition_per_portion || {};

  const kcal =
    nutrition.kcal ??
    nutrition.calories ??
    0;

  const protein = nutrition.protein_g ?? 0;
  const carbs = nutrition.carbs_g ?? 0;
  const fat = nutrition.fat_g ?? 0;
  const fiber = nutrition.fiber_g ?? 0;
  const sodium = nutrition.sodium_mg ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            กำลังโหลดข้อมูลอาหาร...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#333"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            แผนการกิน
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color="#999"
          />

          <Text style={styles.errorText}>
            {error || "ไม่พบข้อมูลอาหาร"}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFoodDetail}
          >
            <Text style={styles.retryText}>
              ลองใหม่
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          แผนการกิน
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Food Image */}
        {food.image_url ? (
          <Image
            source={{ uri: food.image_url }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="fast-food-outline"
              size={70}
              color="#bbb"
            />
          </View>
        )}

        {/* Food Name */}
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>
            {food.name || "ไม่มีชื่ออาหาร"}
          </Text>

          {mealName ? (
            <View style={styles.mealBadge}>
              <Ionicons
                name="restaurant-outline"
                size={15}
                color="#F59E0B"
              />

              <Text style={styles.mealBadgeText}>
                {mealName}
              </Text>
            </View>
          ) : null}

          {food.category ? (
            <Text style={styles.category}>
              {food.category}
            </Text>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "nutrition" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("nutrition")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "nutrition" &&
                  styles.activeTabText,
              ]}
            >
              โภชนาการ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "ingredients" &&
                styles.activeTab,
            ]}
            onPress={() => setActiveTab("ingredients")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "ingredients" &&
                  styles.activeTabText,
              ]}
            >
              ส่วนผสม
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition */}
        {activeTab === "nutrition" && (
          <View>
            <Text style={styles.sectionTitle}>
              🔥 แคลอรี่
            </Text>

            <View style={styles.calorieCard}>
              <Text style={styles.calorieValue}>
                {Number(kcal).toLocaleString()}
              </Text>

              <Text style={styles.calorieUnit}>
                kcal
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              สารอาหารหลัก
            </Text>

            <NutritionRow
              icon="fitness-outline"
              label="โปรตีน"
              value={`${protein} g`}
            />

            <NutritionRow
              icon="water-outline"
              label="คาร์โบไฮเดรต"
              value={`${carbs} g`}
            />

            <NutritionRow
              icon="nutrition-outline"
              label="ไขมัน"
              value={`${fat} g`}
            />

            <NutritionRow
              icon="leaf-outline"
              label="ใยอาหาร"
              value={`${fiber} g`}
            />

            <NutritionRow
              icon="flask-outline"
              label="โซเดียม"
              value={`${sodium} mg`}
            />
          </View>
        )}

        {/* Ingredients */}
        {activeTab === "ingredients" && (
          <View>
            <Text style={styles.sectionTitle}>
              ส่วนผสม
            </Text>

            {food.ingredients &&
            food.ingredients.length > 0 ? (
              <View style={styles.ingredientList}>
                {food.ingredients.map((ingredient, index) => (
                  <View
                    key={`${ingredient.name}-${index}`}
                    style={styles.ingredientRow}
                  >
                    <View style={styles.ingredientLeft}>
                      <View style={styles.dot} />

                      <Text style={styles.ingredientName}>
                        {ingredient.name || "-"}
                      </Text>
                    </View>

                    <Text style={styles.ingredientAmount}>
                      {ingredient.qty ?? "-"}{" "}
                      {ingredient.unit || ""}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="restaurant-outline"
                  size={40}
                  color="#bbb"
                />

                <Text style={styles.emptyText}>
                  ไม่พบข้อมูลส่วนผสม
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NutritionRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.nutritionRow}>
      <View style={styles.nutritionLeft}>
        <View style={styles.nutritionIcon}>
          <Ionicons
            name={icon}
            size={20}
            color="#F59E0B"
          />
        </View>

        <Text style={styles.nutritionLabel}>
          {label}
        </Text>
      </View>

      <Text style={styles.nutritionValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  container: {
    paddingBottom: 40,
  },

  foodImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#f2f2f2",
  },

  imagePlaceholder: {
    width: "100%",
    height: 250,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  foodHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },

  foodName: {
    fontSize: 25,
    fontWeight: "800",
    color: "#222",
  },

  mealBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#FFF7E6",
  },

  mealBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },

  category: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
  },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },

  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#F59E0B",
  },

  tabText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#F59E0B",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },

  calorieCard: {
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 14,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
  },

  calorieValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F59E0B",
  },

  calorieUnit: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },

  nutritionRow: {
    marginHorizontal: 20,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  nutritionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  nutritionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  nutritionLabel: {
    fontSize: 15,
    color: "#444",
    fontWeight: "600",
  },

  nutritionValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "700",
  },

  ingredientList: {
    marginHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },

  ingredientRow: {
    minHeight: 55,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  ingredientLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    marginRight: 10,
  },

  ingredientName: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },

  ingredientAmount: {
    fontSize: 14,
    color: "#777",
    marginLeft: 10,
  },

  emptyBox: {
    marginHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
    borderRadius: 14,
  },

  emptyText: {
    color: "#999",
    marginTop: 8,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#777",
  },

  errorText: {
    marginTop: 15,
    textAlign: "center",
    color: "#777",
    fontSize: 15,
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 25,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
});