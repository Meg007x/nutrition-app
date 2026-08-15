import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import axios from "axios";

// ======================================================
// API
// ======================================================

const API_URL =
  "http://172.16.8.172:3000";

// ======================================================
// Types
// ======================================================

type Food = {
  food_id: string;
  name: string;
  image_url?: string;
  category?: string;
  kcal?: number;
};

type Slot = {
  slot_name: string;
  meal_type: string;
  status?: string;
  target_kcal?: number;

  target_nutrition?: {
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };

  main_food?: Food | null;

  addons?: Food[];

  original_main_food_id?: string | null;
  current_main_food_id?: string | null;

  is_swapped?: boolean;

  swap_history?: any[];
};

type DailyPlan = {
  plan_id: string;
  plan_status: string;
  user_id: string;
  date: string;
  plan_type: string;
  generated_by: string;
  goal: string;
  meals_per_day: number;

  slots: Slot[];

  daily_target_summary?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
};

// ======================================================
// Helpers
// ======================================================

function parseDate(
  dateString: string
) {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatShortDate(
  dateString: string
) {
  const date =
    parseDate(dateString);

  return `${String(
    date.getDate()
  ).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getThaiDay(
  dateString: string
) {
  const date =
    parseDate(dateString);

  const days = [
    "อา.",
    "จ.",
    "อ.",
    "พ.",
    "พฤ.",
    "ศ.",
    "ส.",
  ];

  return days[
    date.getDay()
  ];
}

function createDateList(
  startDate: string,
  days: number
) {
  if (!startDate) {
    return [];
  }

  const start =
    parseDate(startDate);

  return Array.from(
    {
      length: days,
    },
    (_, index) => {
      const date =
        new Date(start);

      date.setDate(
        start.getDate() +
          index
      );

      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  );
}

// ======================================================
// Component
// ======================================================

export default function Step2Screen() {
  const params =
    useLocalSearchParams<{
      startDate?: string;
      endDate?: string;
      days?: string;
      plan_id?: string;
    }>();

  const startDate =
    params.startDate || "";

  const endDate =
    params.endDate || "";

  const planId =
    params.plan_id || "";

  const planDays =
    Number(params.days) || 0;

  const dateTabs =
    useMemo(
      () =>
        createDateList(
          startDate,
          planDays
        ),
      [startDate, planDays]
    );

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(0);

  const [
    plans,
    setPlans,
  ] = useState<
    DailyPlan[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const selectedDate =
    dateTabs[selectedDay];

  const selectedPlan =
    plans.find(
      (plan) =>
        plan.date ===
        selectedDate
    );

  // ====================================================
  // Load Plans
  // ====================================================

  useEffect(() => {
    loadPlans();
  }, [planId]);

  async function loadPlans() {
    try {
      setLoading(true);

      if (!planId) {
        throw new Error(
          "ไม่พบ plan_id"
        );
      }

      const url =
        `${API_URL}/api/meal/plans/${planId}`;

      console.log(
        "📤 GET:",
        url
      );

      const response =
        await axios.get(
          url,
          {
            timeout: 30000,
          }
        );

      console.log(
        "📥 RESPONSE:",
        response.data
      );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "โหลดแผนอาหารไม่สำเร็จ"
        );
      }

      setPlans(
        response.data.plans ||
          []
      );
    } catch (error: any) {
      console.error(
        "❌ LOAD PLAN ERROR:",
        error
      );

      const message =
        axios.isAxiosError(error)
          ? error.response?.data
              ?.message ||
            error.message
          : error?.message ||
            "ไม่สามารถโหลดแผนอาหารได้";

      Alert.alert(
        "โหลดแผนไม่สำเร็จ",
        message
      );
    } finally {
      setLoading(false);
    }
  }

  // ====================================================
  // Save
  // ====================================================

  function handleSave() {
    Alert.alert(
      "บันทึกสำเร็จ",
      "บันทึกแผนอาหารเรียบร้อยแล้ว",
      [
        {
          text: "ตกลง",
          onPress: () =>
            router.replace(
              "/(tabs)/plan"
            ),
        },
      ]
    );
  }

  // ====================================================
  // Loading
  // ====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#F29913"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            กำลังโหลดแผนอาหาร...
          </Text>

          <Text
            style={
              styles.loadingSubText
            }
          >
            กำลังเตรียมแผน{" "}
            {planDays} วัน
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#000"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          สร้างแผนการกิน
        </Text>

        <View
          style={{
            width: 28,
          }}
        />
      </View>

      <View
        style={styles.content}
      >
        <Text
          style={styles.title}
        >
          2. ปรับแต่งมื้ออาหาร
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          {startDate} ถึง{" "}
          {endDate}
        </Text>

        <Text
          style={
            styles.planIdText
          }
        >
          Plan ID: {planId}
        </Text>

        {/* Date Tabs */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.tabsContainer
          }
        >
          {dateTabs.map(
            (
              date,
              index
            ) => {
              const active =
                index ===
                selectedDay;

              const hasPlan =
                plans.some(
                  (plan) =>
                    plan.date ===
                    date
                );

              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dayTab,
                    active &&
                      styles.activeDayTab,
                  ]}
                  onPress={() =>
                    setSelectedDay(
                      index
                    )
                  }
                >
                  <Text
                    style={[
                      styles.dayName,
                      active &&
                        styles.activeDayText,
                    ]}
                  >
                    {getThaiDay(
                      date
                    )}
                  </Text>

                  <Text
                    style={[
                      styles.dateText,
                      active &&
                        styles.activeDayText,
                    ]}
                  >
                    {formatShortDate(
                      date
                    )}
                  </Text>

                  {hasPlan && (
                    <View
                      style={
                        styles.planDot
                      }
                    />
                  )}
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        <Text
          style={
            styles.selectedDate
          }
        >
          แผนวันที่{" "}
          {selectedDate}
        </Text>

        {!selectedPlan ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Ionicons
              name="restaurant-outline"
              size={50}
              color="#999"
            />

            <Text
              style={
                styles.emptyText
              }
            >
              ไม่พบแผนอาหารวันนี้
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            {/* Daily Target */}

            {selectedPlan.daily_target_summary && (
              <View
                style={
                  styles.summaryCard
                }
              >
                <Text
                  style={
                    styles.summaryTitle
                  }
                >
                  เป้าหมายประจำวัน
                </Text>

                <View
                  style={
                    styles.summaryRow
                  }
                >
                  <Text>
                    พลังงาน
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedPlan
                        .daily_target_summary
                        .kcal
                    }{" "}
                    kcal
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryRow
                  }
                >
                  <Text>
                    Protein
                  </Text>

                  <Text>
                    {
                      selectedPlan
                        .daily_target_summary
                        .protein_g
                    }{" "}
                    g
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryRow
                  }
                >
                  <Text>
                    Carbs
                  </Text>

                  <Text>
                    {
                      selectedPlan
                        .daily_target_summary
                        .carb_g
                    }{" "}
                    g
                  </Text>
                </View>

                <View
                  style={
                    styles.summaryRow
                  }
                >
                  <Text>
                    Fat
                  </Text>

                  <Text>
                    {
                      selectedPlan
                        .daily_target_summary
                        .fat_g
                    }{" "}
                    g
                  </Text>
                </View>
              </View>
            )}

            {/* Meals */}

            {selectedPlan.slots?.map(
              (
                slot,
                index
              ) => (
                <View
                  key={`${slot.meal_type}-${index}`}
                  style={
                    styles.mealCard
                  }
                >
                  <View
                    style={
                      styles.mealHeader
                    }
                  >
                    <Text
                      style={
                        styles.mealTitle
                      }
                    >
                      {
                        slot.slot_name
                      }
                    </Text>

                    <Text
                      style={
                        styles.kcalText
                      }
                    >
                      {
                        slot.target_kcal
                      }{" "}
                      kcal
                    </Text>
                  </View>

                  {slot.main_food && (
                    <View
                      style={
                        styles.foodRow
                      }
                    >
                      <View
                        style={
                          styles.foodImage
                        }
                      >
                        <Ionicons
                          name="restaurant"
                          size={30}
                          color="#F29913"
                        />
                      </View>

                      <View
                        style={
                          styles.foodInfo
                        }
                      >
                        <Text
                          style={
                            styles.foodName
                          }
                        >
                          {
                            slot
                              .main_food
                              .name
                          }
                        </Text>

                        <Text
                          style={
                            styles.foodKcal
                          }
                        >
                          {
                            slot
                              .main_food
                              .kcal
                          }{" "}
                          kcal
                        </Text>
                      </View>
                    </View>
                  )}

                  {slot.addons &&
                    slot.addons.length >
                      0 && (
                      <View
                        style={
                          styles.addonContainer
                        }
                      >
                        <Text
                          style={
                            styles.addonTitle
                          }
                        >
                          อาหารเพิ่มเติม
                        </Text>

                        {slot.addons.map(
                          (
                            addon
                          ) => (
                            <Text
                              key={
                                addon.food_id
                              }
                              style={
                                styles.addonText
                              }
                            >
                              +{" "}
                              {
                                addon.name
                              }{" "}
                              (
                              {
                                addon.kcal
                              }{" "}
                              kcal)
                            </Text>
                          )
                        )}
                      </View>
                    )}

                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {slot.is_swapped
                      ? "มีการเปลี่ยนเมนู"
                      : "เมนูแนะนำ"}
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        )}
      </View>

      {/* Footer */}

      <View
        style={styles.footer}
      >
        <TouchableOpacity
          style={
            styles.saveButton
          }
          onPress={
            handleSave
          }
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            บันทึกแผน
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// Styles
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },

    header: {
      height: 60,
      backgroundColor: "#F29913",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 18,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: "bold",
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },

    title: {
      fontSize: 25,
      fontWeight: "bold",
    },

    subtitle: {
      color: "#777",
      marginTop: 5,
    },

    planIdText: {
      fontSize: 11,
      color: "#999",
      marginTop: 5,
    },

    tabsContainer: {
      paddingVertical: 18,
      gap: 8,
    },

    dayTab: {
      width: 64,
      height: 62,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#DDD",
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },

    activeDayTab: {
      backgroundColor: "#F29913",
      borderColor: "#F29913",
    },

    dayName: {
      fontSize: 15,
      fontWeight: "bold",
    },

    dateText: {
      fontSize: 12,
      marginTop: 2,
      color: "#777",
    },

    activeDayText: {
      color: "#fff",
    },

    planDot: {
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor:
        "#22C55E",
      marginTop: 3,
    },

    selectedDate: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
    },

    summaryCard: {
      borderRadius: 14,
      padding: 15,
      marginBottom: 14,
      backgroundColor:
        "#FFF8E8",
    },

    summaryTitle: {
      fontSize: 17,
      fontWeight: "bold",
      marginBottom: 10,
    },

    summaryRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 5,
    },

    summaryValue: {
      fontWeight: "bold",
      color: "#F29913",
    },

    mealCard: {
      borderWidth: 1,
      borderColor: "#E5E5E5",
      borderRadius: 14,
      padding: 15,
      marginBottom: 14,
      backgroundColor: "#fff",
    },

    mealHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 12,
    },

    mealTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },

    kcalText: {
      color: "#F29913",
      fontWeight: "bold",
    },

    foodRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    foodImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor:
        "#FFF3D8",
      justifyContent:
        "center",
      alignItems: "center",
    },

    foodInfo: {
      marginLeft: 12,
      flex: 1,
    },

    foodName: {
      fontSize: 16,
      fontWeight: "600",
    },

    foodKcal: {
      marginTop: 4,
      color: "#777",
    },

    addonContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#eee",
    },

    addonTitle: {
      fontWeight: "600",
      marginBottom: 4,
    },

    addonText: {
      color: "#666",
      marginTop: 3,
    },

    statusText: {
      marginTop: 12,
      fontSize: 12,
      color: "#999",
    },

    emptyContainer: {
      alignItems: "center",
      justifyContent:
        "center",
      paddingTop: 80,
    },

    emptyText: {
      marginTop: 10,
      color: "#777",
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "600",
    },

    loadingSubText: {
      marginTop: 6,
      color: "#777",
    },

    footer: {
      padding: 20,
    },

    saveButton: {
      height: 55,
      borderRadius: 12,
      backgroundColor:
        "#F9A800",
      justifyContent:
        "center",
      alignItems: "center",
    },

    saveButtonText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
    },
  });