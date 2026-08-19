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

import { BASE_URL } from "../../constants/config";

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

function parseDate(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatShortDate(dateString: string) {
  const date = parseDate(dateString);

  return `${String(
    date.getDate()
  ).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getThaiDay(dateString: string) {
  const date = parseDate(dateString);

  const days = [
    "อา.",
    "จ.",
    "อ.",
    "พ.",
    "พฤ.",
    "ศ.",
    "ส.",
  ];

  return days[date.getDay()];
}

function createDateList(
  startDate: string,
  days: number
) {
  if (!startDate || days <= 0) {
    return [];
  }

  const start = parseDate(startDate);

  return Array.from(
    {
      length: days,
    },
    (_, index) => {
      const date = new Date(start);

      date.setDate(
        start.getDate() + index
      );

      const year =
        date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
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

  // ====================================================
  // Date Tabs
  // ====================================================

  const dateTabs = useMemo(
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

  // ====================================================
  // State
  // ====================================================

  const [
    plans,
    setPlans,
  ] = useState<DailyPlan[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ====================================================
  // Selected Date
  // ====================================================

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
        `${BASE_URL}/api/meal/plans/${planId}`;

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
        response.data.plans || []
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
    if (saving) {
      return;
    }

    console.log(
      "💾 SAVE PLAN"
    );

    console.log(
      "PLAN ID:",
      planId
    );

    setSaving(true);

    router.replace({
      pathname: "/(tabs)/plan",
      params: {
        refresh:
          Date.now().toString(),
        plan_id: planId,
      },
    });
  }

  // ====================================================
  // Loading
  // ====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <Ionicons
              name="restaurant-outline"
              size={34}
              color="#666"
            />
          </View>

          <Text
            style={
              styles.loadingText
            }
          >
            กำลังโหลดแผนอาหาร
          </Text>

          <Text
            style={
              styles.loadingSubText
            }
          >
            กำลังเตรียมแผน{" "}
            {planDays} วัน...
          </Text>

          <ActivityIndicator
            size="small"
            color="#F29913"
            style={{
              marginTop: 18,
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* Header */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() => {
            // 🔧 FIX: ไม่ใช้ router.back() เพราะอาจไม่มี screen ใน stack
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/plan");
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#111"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            สร้างแผนการกิน
          </Text>

          <Text
            style={
              styles.headerStep
            }
          >
            ขั้นตอนที่ 2 จาก 2
          </Text>
        </View>

        <View
          style={
            styles.headerPlaceholder
          }
        />
      </View>

      {/* Main Scroll */}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Page Title */}

        <View
          style={
            styles.pageTitleSection
          }
        >
          <View
            style={
              styles.titleIcon
            }
          >
            <Ionicons
              name="restaurant-outline"
              size={25}
              color="#666"
            />
          </View>

          <View
            style={
              styles.titleTextContainer
            }
          >
            <Text
              style={
                styles.title
              }
            >
              ปรับแต่งมื้ออาหาร
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              เลือกดูอาหารในแต่ละวัน
            </Text>
          </View>
        </View>

        {/* Plan Information */}

        <View
          style={
            styles.planInfoCard
          }
        >
          <View
            style={
              styles.planInfoTop
            }
          >
            <View
              style={
                styles.planInfoIcon
              }
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#666"
              />
            </View>

            <View
              style={
                styles.planInfoText
              }
            >
              <Text
                style={
                  styles.planInfoTitle
                }
              >
                แผนการกิน {planDays} วัน
              </Text>

              <Text
                style={
                  styles.planInfoDate
                }
              >
                {startDate} ถึง {endDate}
              </Text>
            </View>

            <View
              style={
                styles.activeBadge
              }
            >
              <View
                style={
                  styles.activeDot
                }
              />

              <Text
                style={
                  styles.activeBadgeText
                }
              >
                พร้อมใช้งาน
              </Text>
            </View>
          </View>
        </View>

        {/* Date Selector */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            เลือกวัน
          </Text>

          <Text
            style={
              styles.sectionHint
            }
          >
            {selectedDay + 1}/{planDays}
          </Text>
        </View>

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
                  activeOpacity={0.8}
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
                      style={[
                        styles.planDot,
                        active &&
                          styles.activePlanDot,
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        {/* Selected Date */}

        <View
          style={
            styles.selectedDateHeader
          }
        >
          <View>
            <Text
              style={
                styles.selectedDateLabel
              }
            >
              เมนูประจำวัน
            </Text>

            <Text
              style={
                styles.selectedDate
              }
            >
              {selectedDate}
            </Text>
          </View>

          {selectedPlan && (
            <View
              style={
                styles.mealCountBadge
              }
            >
              <Ionicons
                name="restaurant"
                size={15}
                color="#666"
              />

              <Text
                style={
                  styles.mealCountText
                }
              >
                {selectedPlan.meals_per_day} มื้อ
              </Text>
            </View>
          )}
        </View>

        {!selectedPlan ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="restaurant-outline"
                size={42}
                color="#B5B5B5"
              />
            </View>

            <Text
              style={
                styles.emptyText
              }
            >
              ไม่พบแผนอาหารวันนี้
            </Text>

            <Text
              style={
                styles.emptySubText
              }
            >
              กรุณาลองเลือกวันอื่น
            </Text>
          </View>
        ) : (
          <>
            {/* Daily Target */}

            {selectedPlan.daily_target_summary && (
              <View
                style={
                  styles.summaryCard
                }
              >
                <View
                  style={
                    styles.summaryHeader
                  }
                >
                  <View
                    style={
                      styles.summaryIcon
                    }
                  >
                    <Ionicons
                      name="analytics-outline"
                      size={20}
                      color="#22A06B"
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.summaryTitle
                      }
                    >
                      เป้าหมายประจำวัน
                    </Text>

                    <Text
                      style={
                        styles.summarySubtitle
                      }
                    >
                      ปริมาณสารอาหารที่แนะนำ
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.nutritionGrid
                  }
                >
                  <View
                    style={
                      styles.nutritionItem
                    }
                  >
                    <Text
                      style={
                        styles.nutritionLabel
                      }
                    >
                      พลังงาน
                    </Text>

                    <Text
                      style={
                        styles.nutritionValueOrange
                      }
                    >
                      {
                        selectedPlan
                          .daily_target_summary
                          .kcal ?? "-"
                      }
                    </Text>

                    <Text
                      style={
                        styles.nutritionUnit
                      }
                    >
                      kcal
                    </Text>
                  </View>

                  <View
                    style={
                      styles.nutritionDivider
                    }
                  />

                  <View
                    style={
                      styles.nutritionItem
                    }
                  >
                    <Text
                      style={
                        styles.nutritionLabel
                      }
                    >
                      Protein
                    </Text>

                    <Text
                      style={
                        styles.nutritionValue
                      }
                    >
                      {
                        selectedPlan
                          .daily_target_summary
                          .protein_g ?? "-"
                      }
                    </Text>

                    <Text
                      style={
                        styles.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>

                  <View
                    style={
                      styles.nutritionDivider
                    }
                  />

                  <View
                    style={
                      styles.nutritionItem
                    }
                  >
                    <Text
                      style={
                        styles.nutritionLabel
                      }
                    >
                      Carbs
                    </Text>

                    <Text
                      style={
                        styles.nutritionValue
                      }
                    >
                      {
                        selectedPlan
                          .daily_target_summary
                          .carb_g ?? "-"
                      }
                    </Text>

                    <Text
                      style={
                        styles.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>

                  <View
                    style={
                      styles.nutritionDivider
                    }
                  />

                  <View
                    style={
                      styles.nutritionItem
                    }
                  >
                    <Text
                      style={
                        styles.nutritionLabel
                      }
                    >
                      Fat
                    </Text>

                    <Text
                      style={
                        styles.nutritionValue
                      }
                    >
                      {
                        selectedPlan
                          .daily_target_summary
                          .fat_g ?? "-"
                      }
                    </Text>

                    <Text
                      style={
                        styles.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Meals */}

            <View
              style={
                styles.mealsSectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.mealsSectionTitle
                  }
                >
                  รายการอาหาร
                </Text>

                <Text
                  style={
                    styles.mealsSectionSubtitle
                  }
                >
                  อาหารที่แนะนำสำหรับวันนี้
                </Text>
              </View>

              <View
                style={
                  styles.mealsCount
                }
              >
                <Text
                  style={
                    styles.mealsCountText
                  }
                >
                  {selectedPlan.slots?.length || 0}
                </Text>

                <Text
                  style={
                    styles.mealsCountLabel
                  }
                >
                  มื้อ
                </Text>
              </View>
            </View>

            {selectedPlan.slots?.map(
              (
                slot,
                index
              ) => {
                // 🔧 กำหนดสีตามมื้ออาหาร
                const mealType = (slot.meal_type || slot.slot_name || "").toLowerCase();
                let mealColorStyle = {};
                if (mealType.includes("เช้า") || mealType.includes("morning")) {
                  mealColorStyle = styles.mealCardMorning;
                } else if (mealType.includes("กลางวัน") || mealType.includes("lunch")) {
                  mealColorStyle = styles.mealCardLunch;
                } else if (mealType.includes("เย็น") || mealType.includes("dinner")) {
                  mealColorStyle = styles.mealCardDinner;
                } else if (mealType.includes("ว่าง") || mealType.includes("snack")) {
                  mealColorStyle = styles.mealCardSnack;
                }

                return (
                <View
                  key={`${slot.meal_type}-${index}`}
                  style={[
                    styles.mealCard,
                    mealColorStyle,
                  ]}
                >
                  {/* Meal Header */}

                  <View
                    style={
                      styles.mealHeader
                    }
                  >
                    <View
                      style={
                        styles.mealNumber
                      }
                    >
                      <Text
                        style={
                          styles.mealNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.mealTitleContainer
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
                          styles.mealTypeText
                        }
                      >
                        {slot.meal_type}
                      </Text>
                    </View>

                    {/* 🔧 เพิ่มปุ่ม Swap, Detail + kcal */}
                    <View style={styles.mealHeaderRight}>
                      <View
                        style={
                          styles.kcalBadge
                        }
                      >
                        <Text
                          style={
                            styles.kcalText
                          }
                        >
                          {slot.target_kcal ?? 0}
                        </Text>
                        <Text
                          style={
                            styles.kcalUnit
                          }
                        >
                          kcal
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.swapBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          Alert.alert(
                            "เปลี่ยนเมนู",
                            `ต้องการเปลี่ยนเมนู "${slot.main_food?.name || slot.slot_name}" ใช่หรือไม่?`,
                            [
                              { text: "ยกเลิก", style: "cancel" },
                              { text: "เปลี่ยน", onPress: () => console.log("🔄 Swap:", slot.slot_name) },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="swap-horizontal" size={16} color="#555" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          Alert.alert(
                            slot.main_food?.name || slot.slot_name || "รายละเอียด",
                            `แคลอรี: ${slot.target_kcal ?? slot.main_food?.kcal ?? 0} kcal\nโปรตีน: ${slot.target_nutrition?.protein_g ?? "-"} g\nคาร์บ: ${slot.target_nutrition?.carb_g ?? "-"} g\nไขมัน: ${slot.target_nutrition?.fat_g ?? "-"} g`
                          );
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#555" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Divider */}

                  <View
                    style={
                      styles.cardDivider
                    }
                  />

                  {/* Main Food */}

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
                          size={27}
                          color="#666"
                        />
                      </View>

                      <View
                        style={
                          styles.foodInfo
                        }
                      >
                        <Text
                          style={
                            styles.foodLabel
                          }
                        >
                          อาหารหลัก
                        </Text>

                        <Text
                          style={
                            styles.foodName
                          }
                          numberOfLines={2}
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
                              .kcal ?? 0
                          }{" "}
                          kcal
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Addons */}

                  {slot.addons &&
                    slot.addons.length >
                      0 && (
                      <View
                        style={
                          styles.addonContainer
                        }
                      >
                        <View
                          style={
                            styles.addonHeader
                          }
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={17}
                            color="#777"
                          />

                          <Text
                            style={
                              styles.addonTitle
                            }
                          >
                            อาหารเพิ่มเติม
                          </Text>
                        </View>

                        {slot.addons.map(
                          (
                            addon
                          ) => (
                            <View
                              key={
                                addon.food_id
                              }
                              style={
                                styles.addonRow
                              }
                            >
                              <View
                                style={
                                  styles.addonBullet
                                }
                              />

                              <Text
                                style={
                                  styles.addonText
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  addon.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.addonKcal
                                }
                              >
                                {
                                  addon.kcal ??
                                    0
                                }{" "}
                                kcal
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  {/* Status */}

                  <View
                    style={[
                      styles.statusContainer,
                      slot.is_swapped &&
                        styles.statusSwapped,
                    ]}
                  >
                    <Ionicons
                      name={
                        slot.is_swapped
                          ? "swap-horizontal-outline"
                          : "checkmark-circle-outline"
                      }
                      size={16}
                      color={
                        slot.is_swapped
                          ? "#D97706"
                          : "#22A06B"
                      }
                    />

                    <Text
                      style={[
                        styles.statusText,
                        slot.is_swapped &&
                          styles.statusSwappedText,
                      ]}
                    >
                      {slot.is_swapped
                        ? "มีการเปลี่ยนเมนู"
                        : "เมนูแนะนำ"}
                    </Text>
                  </View>
                </View>
              )})}


            {/* 🔧 ปุ่มเพิ่มมื้ออาหาร */}
            <TouchableOpacity
              style={styles.addMealBtn}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "เพิ่มมื้ออาหาร",
                  "ต้องการเพิ่มมื้ออาหารใหม่ในวันนี้ใช่หรือไม่?",
                  [
                    { text: "ยกเลิก", style: "cancel" },
                    { text: "เพิ่ม", onPress: () => console.log("➕ Add meal to:", selectedDate) },
                  ]
                );
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#555" />
              <Text style={styles.addMealBtnText}>เพิ่มมื้ออาหาร</Text>
            </TouchableOpacity>

            <View
              style={
                styles.bottomSpace
              }
            />
          </>
        )}
      </ScrollView>

      {/* Footer */}

      <View
        style={
          styles.footer
        }
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
              styles.saveButtonDisabled,
          ]}
          onPress={
            handleSave
          }
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <>
              <ActivityIndicator
                color="#fff"
                size="small"
              />

              <Text
                style={
                  styles.savingText
                }
              >
                กำลังบันทึก...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#fff"
              />

              <Text
                style={
                  styles.saveButtonText
                }
              >
                บันทึกแผน
              </Text>
            </>
          )}
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
      backgroundColor: "#F7F7F7",
    },

    // ==================================================
    // Header
    // ==================================================

    header: {
      height: 68,
      backgroundColor: "#F29913",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        "rgba(255,255,255,0.65)",
      justifyContent: "center",
      alignItems: "center",
    },

    headerCenter: {
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#111",
    },

    headerStep: {
      marginTop: 2,
      fontSize: 11,
      color: "#5F3A00",
      fontWeight: "600",
    },

    headerPlaceholder: {
      width: 40,
    },

    // ==================================================
    // Scroll
    // ==================================================

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 20,
    },

    // ==================================================
    // Page Title
    // ==================================================

    pageTitleSection: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
    },

    titleIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: "#FFF1D6",
      justifyContent: "center",
      alignItems: "center",
    },

    titleTextContainer: {
      flex: 1,
      marginLeft: 13,
    },

    title: {
      fontSize: 24,
      fontWeight: "800",
      color: "#161616",
    },

    subtitle: {
      marginTop: 3,
      fontSize: 13,
      color: "#777",
    },

    // ==================================================
    // Plan Info
    // ==================================================

    planInfoCard: {
      backgroundColor: "#fff",
      borderRadius: 17,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    planInfoTop: {
      flexDirection: "row",
      alignItems: "center",
    },

    planInfoIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: "#FFF5E5",
      justifyContent: "center",
      alignItems: "center",
    },

    planInfoText: {
      flex: 1,
      marginLeft: 12,
    },

    planInfoTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222",
    },

    planInfoDate: {
      marginTop: 4,
      fontSize: 13,
      color: "#777",
    },

    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ECFDF5",
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 20,
    },

    activeDot: {
      width: 7,
      height: 7,
      borderRadius: 7,
      backgroundColor: "#22A06B",
      marginRight: 5,
    },

    activeBadgeText: {
      fontSize: 10,
      color: "#168052",
      fontWeight: "700",
    },

    // ==================================================
    // Section Header
    // ==================================================

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
    },

    sectionHint: {
      fontSize: 12,
      color: "#999",
      fontWeight: "600",
    },

    // ==================================================
    // Date Tabs
    // ==================================================

    tabsContainer: {
      paddingBottom: 20,
      gap: 9,
    },

    dayTab: {
      width: 64,
      height: 68,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#E2E2E2",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },

    activeDayTab: {
      backgroundColor: "#F29913",
      borderColor: "#F29913",
      transform: [
        {
          scale: 1.02,
        },
      ],
    },

    dayName: {
      fontSize: 14,
      fontWeight: "800",
      color: "#333",
    },

    dateText: {
      fontSize: 12,
      marginTop: 3,
      color: "#888",
      fontWeight: "500",
    },

    activeDayText: {
      color: "#fff",
    },

    planDot: {
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor: "#22A06B",
      marginTop: 4,
    },

    activePlanDot: {
      backgroundColor: "#fff",
    },

    // ==================================================
    // Selected Date
    // ==================================================

    selectedDateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 14,
    },

    selectedDateLabel: {
      fontSize: 12,
      color: "#999",
      marginBottom: 2,
    },

    selectedDate: {
      fontSize: 19,
      fontWeight: "800",
      color: "#222",
    },

    mealCountBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F0F0F0",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 5,
    },

    mealCountText: {
      color: "#555",
      fontSize: 11,
      fontWeight: "700",
    },

    // ==================================================
    // Summary
    // ==================================================

    summaryCard: {
      backgroundColor: "#fff",
      borderRadius: 17,
      padding: 16,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 17,
    },

    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    summaryTitle: {
      marginLeft: 11,
      fontSize: 16,
      fontWeight: "800",
      color: "#222",
      fontFamily: "NotoSansThaiBold",
    },

    summarySubtitle: {
      marginLeft: 11,
      marginTop: 2,
      fontSize: 11,
      color: "#999",
      fontFamily: "NotoSansThai",
    },

    nutritionGrid: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FAFAFA",
      borderRadius: 13,
      paddingVertical: 13,
    },

    nutritionItem: {
      flex: 1,
      alignItems: "center",
    },

    nutritionLabel: {
      fontSize: 10,
      color: "#888",
      marginBottom: 4,
      fontFamily: "NotoSansThai",
    },

    nutritionValueOrange: {
      fontSize: 17,
      fontWeight: "800",
      color: "#333",
      fontFamily: "NotoSansThaiBold",
    },

    nutritionValue: {
      fontSize: 17,
      fontWeight: "800",
      color: "#333",
      fontFamily: "NotoSansThaiBold",
    },

    nutritionUnit: {
      fontSize: 9,
      color: "#999",
      marginTop: 1,
      fontFamily: "NotoSansThai",
    },

    nutritionDivider: {
      width: 1,
      height: 35,
      backgroundColor: "#E5E5E5",
    },

    // ==================================================
    // Meals Section
    // ==================================================

    mealsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    mealsSectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      fontFamily: "NotoSansThaiBold",
    },

    mealsSectionSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: "#999",
      fontFamily: "NotoSansThai",
    },

    mealsCount: {
      minWidth: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 7,
    },

    mealsCountText: {
      fontSize: 16,
      fontWeight: "800",
      color: "#333",
      fontFamily: "NotoSansThaiBold",
    },

    mealsCountLabel: {
      fontSize: 8,
      color: "#999",
      marginTop: -1,
      fontFamily: "NotoSansThai",
    },

    // ==================================================
    // Meal Card
    // ==================================================

    mealCard: {
      backgroundColor: "#fff",
      borderRadius: 17,
      padding: 16,
      marginBottom: 13,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    mealCardMorning: {
      borderLeftWidth: 4,
      borderLeftColor: "#F29913",
    },

    mealCardLunch: {
      borderLeftWidth: 4,
      borderLeftColor: "#22A06B",
    },

    mealCardDinner: {
      borderLeftWidth: 4,
      borderLeftColor: "#3B82F6",
    },

    mealCardSnack: {
      borderLeftWidth: 4,
      borderLeftColor: "#8B5CF6",
    },

    mealHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    mealNumber: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    mealNumberText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#555",
    },

    mealHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    swapBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    detailBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    mealTitleContainer: {
      flex: 1,
      marginLeft: 11,
    },

    mealTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222",
    },

    mealTypeText: {
      marginTop: 2,
      fontSize: 10,
      color: "#999",
    },

    kcalBadge: {
      alignItems: "flex-end",
      marginLeft: 8,
    },

    kcalText: {
      color: "#333",
      fontSize: 15,
      fontWeight: "800",
    },

    kcalUnit: {
      fontSize: 9,
      color: "#999",
      marginTop: 1,
    },

    cardDivider: {
      height: 1,
      backgroundColor: "#F0F0F0",
      marginVertical: 14,
    },

    // ==================================================
    // Food
    // ==================================================

    foodRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    foodImage: {
      width: 64,
      height: 64,
      borderRadius: 15,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    foodInfo: {
      flex: 1,
      marginLeft: 12,
    },

    foodLabel: {
      fontSize: 10,
      color: "#999",
      marginBottom: 3,
    },

    foodName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#222",
      lineHeight: 20,
    },

    foodKcal: {
      marginTop: 4,
      fontSize: 11,
      color: "#888",
    },

    // ==================================================
    // Addons
    // ==================================================

    addonContainer: {
      marginTop: 14,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor: "#F0F0F0",
    },

    addonHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
    },

    addonTitle: {
      marginLeft: 6,
      fontSize: 12,
      color: "#666",
      fontWeight: "700",
    },

    addonRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
    },

    addonBullet: {
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor: "#F29913",
      marginRight: 8,
    },

    addonText: {
      flex: 1,
      color: "#666",
      fontSize: 12,
    },

    addonKcal: {
      marginLeft: 8,
      color: "#999",
      fontSize: 10,
    },

    // ==================================================
    // Status
    // ==================================================

    statusContainer: {
      marginTop: 13,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "#ECFDF5",
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    statusSwapped: {
      backgroundColor: "#FFF7E6",
    },

    statusText: {
      marginLeft: 5,
      fontSize: 10,
      color: "#168052",
      fontWeight: "700",
      fontFamily: "NotoSansThaiBold",
    },

    statusSwappedText: {
      color: "#B76B00",
      fontFamily: "NotoSansThaiBold",
    },

    // ==================================================
    // Empty
    // ==================================================

    emptyContainer: {
      backgroundColor: "#fff",
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 55,
      borderWidth: 1,
      borderColor: "#EEEEEE",
    },

    emptyIcon: {
      width: 75,
      height: 75,
      borderRadius: 25,
      backgroundColor: "#F3F3F3",
      justifyContent: "center",
      alignItems: "center",
    },

    emptyText: {
      marginTop: 15,
      color: "#555",
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "NotoSansThaiBold",
    },

    emptySubText: {
      marginTop: 5,
      color: "#999",
      fontSize: 12,
      fontFamily: "NotoSansThai",
    },

    // ==================================================
    // Loading
    // ==================================================

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    loadingIcon: {
      width: 75,
      height: 75,
      borderRadius: 25,
      backgroundColor: "#F0F0F0",
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 18,
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      fontFamily: "NotoSansThaiBold",
    },

    loadingSubText: {
      marginTop: 6,
      color: "#888",
      fontSize: 13,
      fontFamily: "NotoSansThai",
    },

    // ==================================================
    // Footer
    // ==================================================

    footer: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 16,
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
    },

    saveButton: {
      height: 55,
      borderRadius: 15,
      backgroundColor: "#F29913",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3,
    },

    saveButtonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "800",
      fontFamily: "NotoSansThaiBold",
    },

    savingText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 8,
      fontFamily: "NotoSansThaiBold",
    },

    addMealBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "#E0E0E0",
      borderStyle: "dashed",
      paddingVertical: 14,
      marginTop: 8,
      gap: 8,
    },

    addMealBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#555",
      fontFamily: "NotoSansThaiBold",
    },

    bottomSpace: {
      height: 10,
    },
  });