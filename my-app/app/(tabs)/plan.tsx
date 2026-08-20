import { BASE_URL } from "../../constants/config";

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getUserPlan,
  deletePlan as apiDeletePlan,
  replaceMeal,
  deleteMeal,
  searchFoods,
  toggleMealStatus,
  getTodayDate,
  getTodayPlan,
  getEatenKcal,
  getTargetKcal,
  getEatenCount,
  type DailyPlan,
  type SearchResult,
} from "../../services/mealPlanService";

const ORANGE = "#F29913";

/* =========================================================
   DATE HELPERS
========================================================= */

function parseDate(ds: string) {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(ds: string) {
  const d = parseDate(ds);

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

function thaiDay(ds: string) {
  return [
    "อา.",
    "จ.",
    "อ.",
    "พ.",
    "พฤ.",
    "ศ.",
    "ส.",
  ][parseDate(ds).getDay()];
}

function thaiDate(ds: string) {
  const d = parseDate(ds);

  const mo = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return `${d.getDate()} ${mo[d.getMonth()]} ${
    d.getFullYear() + 543
  }`;
}

function mealIcon(mt: string) {
  const t = String(mt || "").toLowerCase();

  if (
    t.includes("breakfast") ||
    t.includes("เช้า")
  ) {
    return "sunny-outline";
  }

  if (
    t.includes("lunch") ||
    t.includes("กลางวัน")
  ) {
    return "partly-sunny-outline";
  }

  if (
    t.includes("dinner") ||
    t.includes("เย็น")
  ) {
    return "moon-outline";
  }

  return "restaurant-outline";
}

/* =========================================================
   FOOD HELPERS

   MasterFood:

   _id: String
   name: String
   name_en: String
   image: String

   nutrition_per_portion:
   {
      kcal,
      protein_g,
      carb_g,
      fat_g,
      fiber_g,
      sodium_mg
   }

   ingredients:
   [
      {
         ingredient_id,
         qty,
         unit
      }
   ]
========================================================= */

/*
 * แปลงชื่อไฟล์รูปจาก MasterFood
 *
 * ตัวอย่าง:
 *
 * food.image
 *    = "chicken_salad.jpg"
 *
 * จะถูกแปลงเป็น:
 *
 * http://<BACKEND_HOST>:3000/uploads/master/chicken_salad.jpg
 *
 * ถ้า API ส่ง URL เต็มมาอยู่แล้ว จะใช้ URL เดิม
 */
function getFoodImage(food: any): string | null {
  if (!food) return null;

  const image =
    food.image ||
    food.image_url ||
    food.imageUrl ||
    food.photo ||
    food.photo_url ||
    food.thumbnail ||
    null;

  if (
    !image ||
    typeof image !== "string"
  ) {
    return null;
  }

  const value = image.trim();

  if (!value) {
    return null;
  }

  /*
   * ถ้า Backend ส่ง URL เต็มมาแล้ว
   * เช่น:
   * http://192.168.1.100:3000/uploads/master/chicken_salad.jpg
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  /*
   * รองรับกรณี image เป็น path เช่น:
   *
   * /uploads/master/chicken_salad.jpg
   * uploads/master/chicken_salad.jpg
   * master/chicken_salad.jpg
   * chicken_salad.jpg
   */

  let filename = value;

  filename = filename.replace(/\\/g, "/");

  filename = filename
    .replace(/^\/+/, "")
    .replace(/^uploads\/master\//i, "")
    .replace(/^master\//i, "");

  /*
   * เอาเฉพาะชื่อไฟล์สุดท้าย
   */
  filename =
    filename.split("/").pop() ||
    filename;

  /*
   * สร้าง URL ไปยัง Backend
   */
  return `${BASE_URL}/uploads/master/${encodeURIComponent(
    filename
  )}`;
}

function getFoodName(food: any): string {
  return (
    food?.name ||
    food?.food_name ||
    food?.menu_name ||
    "ไม่มีชื่อเมนู"
  );
}

function getFoodEnglishName(
  food: any
): string | null {
  return (
    food?.name_en ||
    food?.food_name_en ||
    food?.menu_name_en ||
    null
  );
}

function getNutrition(food: any) {
  const n =
    food?.nutrition_per_portion ||
    food?.nutrition ||
    food?.nutrients ||
    {};

  return {
    kcal:
      Number(
        n?.kcal ??
          food?.kcal ??
          food?.calories ??
          0
      ) || 0,

    protein:
      Number(
        n?.protein_g ??
          n?.protein ??
          food?.protein_g ??
          food?.protein ??
          0
      ) || 0,

    carbs:
      Number(
        n?.carb_g ??
          n?.carbs_g ??
          n?.carbohydrate_g ??
          n?.carbs ??
          food?.carb_g ??
          food?.carbs ??
          0
      ) || 0,

    fat:
      Number(
        n?.fat_g ??
          n?.fat ??
          food?.fat_g ??
          food?.fat ??
          0
      ) || 0,

    fiber:
      Number(
        n?.fiber_g ??
          food?.fiber_g ??
          0
      ) || 0,

    sodium:
      Number(
        n?.sodium_mg ??
          food?.sodium_mg ??
          0
      ) || 0,
  };
}

/*
 * MasterFood ingredients:

 ingredients: [
   {
      ingredient_id: String,
      qty: Number,
      unit: String
   }
 ]
 */
function getIngredients(food: any): any[] {
  if (!food) return [];

  const ingredients =
    food?.ingredients ||
    [];

  if (Array.isArray(ingredients)) {
    return ingredients;
  }

  return [];
}

function formatIngredient(
  ingredient: any
): string {
  if (!ingredient) return "";

  const name =
    ingredient?.name ||
    ingredient?.ingredient_name ||
    ingredient?.food_name ||
    ingredient?.ingredient_id ||
    "";

  const qty =
    ingredient?.qty ??
    ingredient?.amount ??
    "";

  const unit =
    ingredient?.unit ||
    "";

  const parts: string[] = [];

  if (name) {
    parts.push(String(name));
  }

  if (
    qty !== "" &&
    qty !== null &&
    qty !== undefined
  ) {
    parts.push(String(qty));
  }

  if (unit) {
    parts.push(String(unit));
  }

  return parts.join(" ");
}

/* =========================================================
   PLAN SCREEN
========================================================= */

export default function PlanScreen() {
  const [plans, setPlans] =
    useState<DailyPlan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [hasPlan, setHasPlan] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<"today" | "full">(
      "today"
    );

  const [dayIdx, setDayIdx] =
    useState(0);

  /* =====================================================
     SEARCH / REPLACE MODAL
  ===================================================== */

  const [showModal, setShowModal] =
    useState(false);

  const [selSlot, setSelSlot] =
    useState<{
      planId: string;
      date: string;
      idx: number;
      name: string;
    } | null>(null);

  const [searchQ, setSearchQ] =
    useState("");

  const [searchRes, setSearchRes] =
    useState<SearchResult[]>([]);

  const [searching, setSearching] =
    useState(false);

  const timerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  /* =====================================================
     FOOD DETAIL MODAL
  ===================================================== */

  const [
    showFoodDetail,
    setShowFoodDetail,
  ] = useState(false);

  const [
    selectedFood,
    setSelectedFood,
  ] = useState<any>(null);

  /* =====================================================
     GET USER ID
  ===================================================== */

  async function getUid() {
    for (const key of [
      "user_id",
      "userId",
    ]) {
      const value =
        await AsyncStorage.getItem(
          key
        );

      if (value) {
        return value;
      }
    }

    const raw =
      await AsyncStorage.getItem(
        "currentUser"
      );

    if (raw) {
      try {
        const user =
          JSON.parse(raw);

        if (user?.user_id) {
          return String(
            user.user_id
          );
        }

        if (user?.userId) {
          return String(
            user.userId
          );
        }

        if (user?._id) {
          return String(
            user._id
          );
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /* =====================================================
     LOAD PLAN
  ===================================================== */

  async function loadPlan() {
    try {
      setLoading(true);

      const uid =
        await getUid();

      if (!uid) {
        setPlans([]);
        setHasPlan(false);
        return;
      }

      const data =
        await getUserPlan(uid);

      setHasPlan(
        data?.hasPlan === true
      );

      const p =
        Array.isArray(data?.plans)
          ? data.plans
          : [];

      setPlans(p);

      const today =
        getTodayDate();

      const ti =
        p.findIndex(
          (x: DailyPlan) =>
            x.date === today
        );

      if (ti >= 0) {
        setDayIdx(ti);
      } else if (
        p.length > 0 &&
        dayIdx >= p.length
      ) {
        setDayIdx(0);
      }
    } catch (e: any) {
      console.error(
        "loadPlan error:",
        e
      );

      setHasPlan(false);

      Alert.alert(
        "โหลดแผนไม่สำเร็จ",
        e?.message ||
          "ไม่สามารถโหลดแผนอาหารได้"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [])
  );

  /* =====================================================
     TODAY DATA
  ===================================================== */

  const todayPlan =
    useMemo(
      () =>
        getTodayPlan(plans),
      [plans]
    );

  const eatenKcal =
    useMemo(
      () =>
        getEatenKcal(
          todayPlan
        ),
      [todayPlan]
    );

  const targetKcal =
    useMemo(
      () =>
        getTargetKcal(
          todayPlan
        ),
      [todayPlan]
    );

  const eatenCount =
    useMemo(
      () =>
        getEatenCount(
          todayPlan
        ),
      [todayPlan]
    );

  const selDay =
    plans[dayIdx] || null;

  /* =====================================================
     DELETE PLAN
  ===================================================== */

  function confirmDel(
    plan: DailyPlan
  ) {
    Alert.alert(
      "ลบแผนอาหาร",
      `ต้องการลบแผน ${plan.plan_id}?`,
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () =>
            handleDeletePlan(
              plan.plan_id
            ),
        },
      ]
    );
  }

  async function handleDeletePlan(
    planId: string
  ) {
    try {
      await apiDeletePlan(
        planId
      );

      setPlans((current) => {
        const updated =
          current.filter(
            (x) =>
              x.plan_id !==
              planId
          );

        setHasPlan(
          updated.length > 0
        );

        return updated;
      });

      Alert.alert(
        "สำเร็จ",
        "ลบแผนอาหารแล้ว"
      );
    } catch (e: any) {
      Alert.alert(
        "ลบไม่สำเร็จ",
        e?.message ||
          "ไม่สามารถลบแผนอาหารได้"
      );
    }
  }

  /* =====================================================
     TOGGLE EATEN
  ===================================================== */

  async function handleToggle(
    planId: string,
    date: string,
    slotIndex: number,
    currentStatus: string
  ) {
    try {
      const newStatus =
        currentStatus ===
        "eaten"
          ? "pending"
          : "eaten";

      await toggleMealStatus(
        planId,
        date,
        slotIndex,
        newStatus
      );

      setPlans((current) =>
        current.map((plan) => {
          if (
            plan.plan_id ===
              planId &&
            plan.date === date
          ) {
            const slots = [
              ...plan.slots,
            ];

            if (
              slots[slotIndex]
            ) {
              slots[slotIndex] = {
                ...slots[
                  slotIndex
                ],
                status:
                  newStatus,
              };
            }

            return {
              ...plan,
              slots,
            };
          }

          return plan;
        })
      );
    } catch (e: any) {
      Alert.alert(
        "อัปเดตไม่สำเร็จ",
        e?.message ||
          "ไม่สามารถอัปเดตสถานะมื้ออาหารได้"
      );
    }
  }

  /* =====================================================
     OPEN CHANGE FOOD MODAL
  ===================================================== */

  function openModal(
    planId: string,
    date: string,
    slotIndex: number,
    slotName: string
  ) {
    setSelSlot({
      planId,
      date,
      idx: slotIndex,
      name: slotName,
    });

    setSearchQ("");
    setShowModal(true);

    // Load default recommendations from DB
    loadDefaultFoods();
  }

  async function loadDefaultFoods() {
    try {
      setSearching(true);
      const data = await searchFoods("", 20);
      setSearchRes(
        Array.isArray(data?.foods)
          ? data.foods
          : []
      );
    } catch (e) {
      console.warn(
        "loadDefaultFoods error:",
        e
      );
      setSearchRes([]);
    } finally {
      setSearching(false);
    }
  }

  /* =====================================================
     SEARCH FOOD
  ===================================================== */

  function onSearch(
    text: string
  ) {
    setSearchQ(text);

    if (timerRef.current) {
      clearTimeout(
        timerRef.current
      );
    }

    // If cleared, reload default recommendations
    if (!text.trim()) {
      loadDefaultFoods();
      return;
    }

    setSearching(true);

    timerRef.current =
      setTimeout(
        async () => {
          try {
            const data =
              await searchFoods(
                text.trim(),
                15
              );

            setSearchRes(
              Array.isArray(
                data?.foods
              )
                ? data.foods
                : []
            );
          } catch (e) {
            console.error(
              "searchFoods error:",
              e
            );

            setSearchRes([]);
          } finally {
            setSearching(false);
          }
        },
        400
      );
  }

  /* =====================================================
     FOOD DETAIL
  ===================================================== */

  function openFoodDetail(
    food: any
  ) {
    setSelectedFood(food);
    setShowFoodDetail(true);
  }

  function closeFoodDetail() {
    setShowFoodDetail(false);
    setSelectedFood(null);
  }

  /* =====================================================
     REPLACE MEAL
  ===================================================== */

  async function doReplace(
    foodId: string
  ) {
    if (!selSlot) {
      return;
    }

    try {
      await replaceMeal(
        selSlot.planId,
        selSlot.date,
        selSlot.idx,
        foodId
      );

      Alert.alert(
        "สำเร็จ",
        "แทนที่มื้ออาหารแล้ว"
      );

      setShowFoodDetail(
        false
      );

      setSelectedFood(null);

      setShowModal(false);
      setSelSlot(null);

      await loadPlan();
    } catch (e: any) {
      Alert.alert(
        "แทนที่ไม่สำเร็จ",
        e?.message ||
          "ไม่สามารถแทนที่มื้ออาหารได้"
      );
    }
  }

  /* =====================================================
     DELETE MEAL
  ===================================================== */

  function doDeleteMeal(
    planId: string,
    date: string,
    slotIndex: number
  ) {
    Alert.alert(
      "ลบมื้ออาหาร",
      "ต้องการลบมื้อนี้?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress:
            async () => {
              try {
                await deleteMeal(
                  planId,
                  String(
                    slotIndex
                  ),
                  date
                );

                Alert.alert(
                  "สำเร็จ",
                  "ลบมื้ออาหารแล้ว"
                );

                setShowModal(
                  false
                );

                setSelSlot(null);

                await loadPlan();
              } catch (
                e: any
              ) {
                Alert.alert(
                  "ลบไม่สำเร็จ",
                  e?.message ||
                    "ไม่สามารถลบมื้ออาหารได้"
                );
              }
            },
        },
      ]
    );
  }

  /* =====================================================
     SCAN REPLACE
  ===================================================== */

  function doScanReplace() {
    if (!selSlot) {
      return;
    }

    setShowModal(false);

    router.push({
      pathname:
        "/food-scan",
      params: {
        replaceTarget:
          JSON.stringify(
            selSlot
          ),
      },
    });
  }

  /* =====================================================
     FOOD IMAGE COMPONENT
  ===================================================== */

  function FoodImage({
    food,
    size = 72,
  }: {
    food: any;
    size?: number;
  }) {
    const image =
      getFoodImage(food);

    if (image) {
      return (
        <Image
          source={{
            uri: image,
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            backgroundColor:
              "#f0f0f0",
          }}
          resizeMode="cover"
          onError={(event) => {
            console.log(
              "Food image load error:",
              image,
              event.nativeEvent.error
            );
          }}
        />
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor:
            "#f0f0f0",
          justifyContent:
            "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name="fast-food-outline"
          size={size * 0.42}
          color="#ccc"
        />
      </View>
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading &&
    plans.length === 0
  ) {
    return (
      <SafeAreaView
        style={st.container}
      >
        <View
          style={st.header}
        >
          <Text
            style={
              st.headerTitle
            }
          >
            แผนอาหาร
          </Text>
        </View>

        <View
          style={st.center}
        >
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />

          <Text
            style={{
              marginTop: 12,
              color: "#777",
            }}
          >
            กำลังโหลด...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =====================================================
     NO PLAN
  ===================================================== */

  if (
    !hasPlan ||
    plans.length === 0
  ) {
    return (
      <SafeAreaView
        style={st.container}
      >
        <View
          style={st.header}
        >
          <Text
            style={
              st.headerTitle
            }
          >
            แผนอาหาร
          </Text>
        </View>

        <View
          style={st.center}
        >
          <Ionicons
            name="nutrition-outline"
            size={64}
            color={ORANGE}
          />

          <Text
            style={
              st.emptyTitle
            }
          >
            ยังไม่มีแผนอาหาร
          </Text>

          <Text
            style={
              st.emptyText
            }
          >
            เริ่มต้นสร้างแผนอาหาร{"\n"}
            เพื่อสุขภาพที่ดีของคุณ
          </Text>

          <TouchableOpacity
            style={
              st.createBtn
            }
            onPress={() =>
              router.push(
                "/create-plan/step1"
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color="#fff"
            />

            <Text
              style={
                st.createBtnText
              }
            >
              สร้างแผนอาหาร
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =====================================================
     ACTIVE PLAN
  ===================================================== */

  return (
    <SafeAreaView
      style={st.container}
    >
      {/* HEADER */}

      <View
        style={st.header}
      >
        <Text
          style={
            st.headerTitle
          }
        >
          แผนอาหาร
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/create-plan/step1"
            )
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* TAB */}

      <View
        style={st.tabBar}
      >
        <TouchableOpacity
          style={[
            st.tab,
            activeTab ===
              "today" &&
              st.tabActive,
          ]}
          onPress={() =>
            setActiveTab(
              "today"
            )
          }
        >
          <Text
            style={[
              st.tabText,
              activeTab ===
                "today" &&
                st.tabTextActive,
            ]}
          >
            วันนี้
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            st.tab,
            activeTab ===
              "full" &&
              st.tabActive,
          ]}
          onPress={() =>
            setActiveTab(
              "full"
            )
          }
        >
          <Text
            style={[
              st.tabText,
              activeTab ===
                "full" &&
                st.tabTextActive,
            ]}
          >
            แผนทั้งหมด
          </Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          TODAY
      ===================================================== */}

      {activeTab ===
      "today" ? (
        <ScrollView
          style={{
            flex: 1,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() => {
                setRefreshing(
                  true
                );
                loadPlan();
              }}
            />
          }
        >
          {/* SUMMARY */}

          <View
            style={
              st.summaryCard
            }
          >
            <View
              style={{
                flexDirection:
                  "row",
                alignItems:
                  "center",
                gap: 8,
              }}
            >
              <Ionicons
                name="flame-outline"
                size={22}
                color={ORANGE}
              />

              <Text
                style={{
                  fontSize: 18,
                  fontWeight:
                    "bold",
                }}
              >
                {thaiDate(
                  todayPlan?.date ||
                    getTodayDate()
                )}
              </Text>
            </View>

            <View
              style={{
                marginTop: 12,
              }}
            >
              <View
                style={
                  st.progressBar
                }
              >
                <View
                  style={[
                    st.progressFill,
                    {
                      width:
                        targetKcal >
                        0
                          ? `${Math.min(
                              100,
                              (eatenKcal /
                                targetKcal) *
                                100
                            )}%`
                          : "0%",
                    },
                  ]}
                />
              </View>

              <Text
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: "#777",
                  textAlign:
                    "right",
                }}
              >
                {eatenKcal} /{" "}
                {targetKcal} kcal
              </Text>
            </View>

            <View
              style={{
                flexDirection:
                  "row",
                marginTop: 12,
              }}
            >
              {[
                {
                  label:
                    "Protein",
                  value:
                    todayPlan
                      ?.daily_target_summary
                      ?.protein_g ??
                    0,
                  color:
                    "#3B82F6",
                },
                {
                  label:
                    "Carbs",
                  value:
                    todayPlan
                      ?.daily_target_summary
                      ?.carb_g ??
                    0,
                  color:
                    "#F59E0B",
                },
                {
                  label: "Fat",
                  value:
                    todayPlan
                      ?.daily_target_summary
                      ?.fat_g ??
                    0,
                  color:
                    "#EF4444",
                },
              ].map(
                (macro) => (
                  <View
                    key={
                      macro.label
                    }
                    style={{
                      flex: 1,
                      alignItems:
                        "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          "#999",
                      }}
                    >
                      {
                        macro.label
                      }
                    </Text>

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight:
                          "bold",
                        color:
                          macro.color,
                        marginTop: 2,
                      }}
                    >
                      {
                        macro.value
                      }g
                    </Text>
                  </View>
                )
              )}
            </View>

            <View
              style={{
                flexDirection:
                  "row",
                alignItems:
                  "center",
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    "#22A06B",
                }}
              />

              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  color:
                    "#22A06B",
                  fontWeight:
                    "600",
                }}
              >
                กินแล้ว{" "}
                {eatenCount}/
                {todayPlan
                  ?.slots
                  ?.length ||
                  0}{" "}
                มื้อ
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight:
                "bold",
              marginBottom: 12,
            }}
          >
            มื้ออาหารวันนี้
          </Text>

          {/* TODAY MEALS */}

          {todayPlan?.slots?.map(
            (slot, idx) => {
              const isE =
                slot.status ===
                "eaten";

              const hasF =
                !!slot.main_food;

              const food: any =
                slot.main_food;

              return (
                <View
                  key={idx}
                  style={
                    st.mealCard
                  }
                >
                  <View
                    style={{
                      flexDirection:
                        "row",
                      alignItems:
                        "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons
                      name={
                        mealIcon(
                          slot.meal_type
                        ) as any
                      }
                      size={20}
                      color={
                        "#000"
                      }
                    />

                    <TouchableOpacity
                      disabled={
                        !hasF
                      }
                      onPress={() =>
                        openFoodDetail(
                          food
                        )
                      }
                      style={{
                        flex: 1,
                        flexDirection:
                          "row",
                        alignItems:
                          "center",
                        gap: 10,
                      }}
                      activeOpacity={
                        0.75
                      }
                    >
                      <FoodImage
                        food={
                          food
                        }
                        size={62}
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              "#999",
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            slot.slot_name
                          }
                        </Text>

                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight:
                              "bold",
                            color:
                              "#333",
                            marginTop:
                              2,
                          }}
                          numberOfLines={
                            2
                          }
                        >
                          {getFoodName(
                            food
                          )}
                        </Text>

                        {hasF && (
                          <Text
                            style={{
                              fontSize: 12,
                              color:
                                "#999",
                              marginTop:
                                3,
                            }}
                          >
                            แตะเพื่อดูรายละเอียด
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {hasF && (
                      <TouchableOpacity
                        onPress={() =>
                          handleToggle(
                            todayPlan.plan_id,
                            todayPlan.date,
                            idx,
                            slot.status ||
                              "pending"
                          )
                        }
                      >
                        <Ionicons
                          name={
                            isE
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={
                            26
                          }
                          color={
                            isE
                              ? "#22A06B"
                              : "#ccc"
                          }
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {hasF && (
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color:
                          ORANGE,
                        fontWeight:
                          "bold",
                      }}
                    >
                      {
                        getNutrition(
                          food
                        ).kcal
                      }{" "}
                      kcal
                    </Text>
                  )}

                  <View
                    style={{
                      flexDirection:
                        "row",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={
                        st.actionBtn
                      }
                      onPress={() =>
                        openModal(
                          todayPlan.plan_id,
                          todayPlan.date,
                          idx,
                          slot.slot_name
                        )
                      }
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={16}
                        color={
                          ORANGE
                        }
                      />

                      <Text
                        style={{
                          fontSize: 13,
                          color:
                            ORANGE,
                          fontWeight:
                            "600",
                        }}
                      >
                        เปลี่ยน
                      </Text>
                    </TouchableOpacity>

                    {hasF && (
                      <TouchableOpacity
                        style={
                          st.actionBtn
                        }
                        onPress={() =>
                          doDeleteMeal(
                            todayPlan.plan_id,
                            todayPlan.date,
                            idx
                          )
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />

                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              "#EF4444",
                            fontWeight:
                              "600",
                          }}
                        >
                          ลบ
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }
          )}

          {/* BOTTOM BUTTONS */}

          <View
            style={{
              flexDirection:
                "row",
              gap: 10,
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              style={
                st.outlineBtn
              }
              onPress={() =>
                setActiveTab(
                  "full"
                )
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  "#000"
                }
              />

              <Text
                style={{
                  fontSize: 15,
                  color:
                    "#000",
                  fontWeight:
                    "600",
                }}
              >
                ดูแผนทั้งหมด
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                st.dangerBtn
              }
              onPress={() => {
                const first =
                  plans[0];

                if (first) {
                  confirmDel(
                    first
                  );
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#fff"
              />

              <Text
                style={{
                  fontSize: 15,
                  color: "#fff",
                  fontWeight:
                    "600",
                }}
              >
                ลบแผน
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* =================================================
           FULL PLAN
        ================================================= */

        <ScrollView
          style={{
            flex: 1,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() => {
                setRefreshing(
                  true
                );
                loadPlan();
              }}
            />
          }
        >
          {/* DAY TABS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            style={{
              marginBottom: 16,
            }}
            contentContainerStyle={{
              gap: 8,
            }}
          >
            {plans.map(
              (plan, index) => (
                <TouchableOpacity
                  key={`${plan.plan_id}-${plan.date}`}
                  style={[
                    st.dayTab,
                    dayIdx ===
                      index &&
                      st.dayTabActive,
                  ]}
                  onPress={() =>
                    setDayIdx(
                      index
                    )
                  }
                >
                  <Text
                    style={[
                      {
                        fontSize: 13,
                        fontWeight:
                          "800",
                        color:
                          "#333",
                      },
                      dayIdx ===
                        index && {
                        color:
                          "#fff",
                      },
                    ]}
                  >
                    {thaiDay(
                      plan.date
                    )}
                  </Text>

                  <Text
                    style={[
                      {
                        fontSize: 11,
                        color:
                          "#999",
                        marginTop:
                          2,
                      },
                      dayIdx ===
                        index && {
                        color:
                          "#fff",
                      },
                    ]}
                  >
                    {fmtShort(
                      plan.date
                    )}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          {selDay && (
            <>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight:
                    "bold",
                  marginBottom: 12,
                }}
              >
                {thaiDate(
                  selDay.date
                )}
              </Text>

              {selDay.slots?.map(
                (slot, idx) => {
                  const isE =
                    slot.status ===
                    "eaten";

                  const hasF =
                    !!slot.main_food;

                  const food: any =
                    slot.main_food;

                  return (
                    <View
                      key={idx}
                      style={
                        st.mealCard
                      }
                    >
                      <View
                        style={{
                          flexDirection:
                            "row",
                          alignItems:
                            "center",
                          gap: 10,
                        }}
                      >
                        <Ionicons
                          name={
                            mealIcon(
                              slot.meal_type
                            ) as any
                          }
                          size={20}
                          color={
                            "#000"
                          }
                        />

                        <TouchableOpacity
                          disabled={
                            !hasF
                          }
                          onPress={() =>
                            openFoodDetail(
                              food
                            )
                          }
                          style={{
                            flex: 1,
                            flexDirection:
                              "row",
                            alignItems:
                              "center",
                            gap: 10,
                          }}
                          activeOpacity={
                            0.75
                          }
                        >
                          <FoodImage
                            food={
                              food
                            }
                            size={
                              62
                            }
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color:
                                  "#999",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {
                                slot.slot_name
                              }
                            </Text>

                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight:
                                  "bold",
                                color:
                                  "#333",
                                marginTop:
                                  2,
                              }}
                              numberOfLines={
                                2
                              }
                            >
                              {getFoodName(
                                food
                              )}
                            </Text>

                            {hasF && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color:
                                    "#999",
                                  marginTop:
                                    3,
                                }}
                              >
                                แตะเพื่อดูรายละเอียด
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {hasF && (
                          <TouchableOpacity
                            onPress={() =>
                              handleToggle(
                                selDay.plan_id,
                                selDay.date,
                                idx,
                                slot.status ||
                                  "pending"
                              )
                            }
                          >
                            <Ionicons
                              name={
                                isE
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={
                                26
                              }
                              color={
                                isE
                                  ? "#22A06B"
                                  : "#ccc"
                              }
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {hasF && (
                        <Text
                          style={{
                            marginTop: 8,
                            fontSize: 14,
                            color:
                              ORANGE,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {
                            getNutrition(
                              food
                            ).kcal
                          }{" "}
                          kcal
                        </Text>
                      )}

                      <View
                        style={{
                          flexDirection:
                            "row",
                          gap: 10,
                          marginTop: 10,
                        }}
                      >
                        <TouchableOpacity
                          style={
                            st.actionBtn
                          }
                          onPress={() =>
                            openModal(
                              selDay.plan_id,
                              selDay.date,
                              idx,
                              slot.slot_name
                            )
                          }
                        >
                          <Ionicons
                            name="swap-horizontal-outline"
                            size={16}
                            color={
                              ORANGE
                            }
                          />

                          <Text
                            style={{
                              fontSize: 13,
                              color:
                                ORANGE,
                              fontWeight:
                                "600",
                            }}
                          >
                            เปลี่ยน
                          </Text>
                        </TouchableOpacity>

                        {hasF && (
                          <TouchableOpacity
                            style={
                              st.actionBtn
                            }
                            onPress={() =>
                              doDeleteMeal(
                                selDay.plan_id,
                                selDay.date,
                                idx
                              )
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={
                                16
                              }
                              color="#EF4444"
                            />

                            <Text
                              style={{
                                fontSize: 13,
                                color:
                                  "#EF4444",
                                fontWeight:
                                  "600",
                              }}
                            >
                              ลบ
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }
              )}
            </>
          )}

          <TouchableOpacity
            style={[
              st.dangerBtn,
              {
                marginTop: 24,
                marginBottom: 20,
              },
            ]}
            onPress={() => {
              const first =
                plans[0];

              if (first) {
                confirmDel(
                  first
                );
              }
            }}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#fff"
            />

            <Text
              style={{
                fontSize: 16,
                color: "#fff",
                fontWeight:
                  "bold",
              }}
            >
              ลบแผนอาหารทั้งหมด
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* =====================================================
          CHANGE FOOD MODAL
      ===================================================== */}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setShowModal(false)
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor:
              "#fff",
          }}
        >
          <View
            style={{
              flexDirection:
                "row",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor:
                "#eee",
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setShowModal(
                  false
                )
              }
            >
              <Ionicons
                name="close"
                size={28}
                color="#333"
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 17,
                fontWeight:
                  "bold",
              }}
            >
              เปลี่ยน{" "}
              {selSlot?.name ||
                "มื้ออาหาร"}
            </Text>

            <View
              style={{
                width: 28,
              }}
            />
          </View>

          <View
            style={{
              flexDirection:
                "row",
              alignItems:
                "center",
              margin: 16,
              paddingHorizontal: 14,
              backgroundColor:
                "#f5f5f5",
              borderRadius: 12,
              height: 46,
              gap: 8,
            }}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#999"
            />

            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: "#333",
              }}
              placeholder="ค้นหาอาหาร เช่น อกไก่..."
              placeholderTextColor="#aaa"
              value={searchQ}
              onChangeText={
                onSearch
              }
              autoFocus
            />

            {searchQ.length >
              0 && (
              <TouchableOpacity
                onPress={() =>
                  onSearch("")
                }
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* SCAN + DELETE */}

          <View
            style={{
              flexDirection:
                "row",
              paddingHorizontal: 16,
              gap: 10,
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection:
                  "row",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor:
                  "#FFF8E8",
              }}
              onPress={
                doScanReplace
              }
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={
                  ORANGE
                }
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight:
                    "600",
                  color:
                    ORANGE,
                }}
              >
                สแกนอาหาร
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection:
                  "row",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor:
                  "#FEF2F2",
              }}
              onPress={() => {
                if (selSlot) {
                  doDeleteMeal(
                    selSlot.planId,
                    selSlot.date,
                    selSlot.idx
                  );
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color="#EF4444"
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight:
                    "600",
                  color:
                    "#EF4444",
                }}
              >
                ลบมื้อนี้
              </Text>
            </TouchableOpacity>
          </View>

          {searching && (
            <ActivityIndicator
              size="small"
              color={ORANGE}
              style={{
                marginTop: 20,
              }}
            />
          )}

          <FlatList
            data={searchRes}
            keyExtractor={(
              item: any,
              index
            ) =>
              String(
                item?._id ??
                  index
              )
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 30,
            }}
            ListEmptyComponent={
              searchQ.length >
                0 &&
              !searching ? (
                <View
                  style={{
                    alignItems:
                      "center",
                    paddingTop: 60,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={40}
                    color="#ddd"
                  />

                  <Text
                    style={{
                      marginTop: 12,
                      color:
                        "#ccc",
                    }}
                  >
                    ไม่พบอาหาร
                  </Text>
                </View>
              ) : searchQ.length ===
                0 ? (
                <View
                  style={{
                    alignItems:
                      "center",
                    paddingTop: 60,
                  }}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={40}
                    color="#ddd"
                  />

                  <Text
                    style={{
                      marginTop: 12,
                      color:
                        "#ccc",
                    }}
                  >
                    กำลังโหลดรายการอาหาร...
                  </Text>
                </View>
              ) : null
            }
            renderItem={({
              item,
            }) => {
              const food: any =
                item;

              const nutrition =
                getNutrition(
                  food
                );

              return (
                <TouchableOpacity
                  style={{
                    flexDirection:
                      "row",
                    alignItems:
                      "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor:
                      "#f0f0f0",
                    gap: 12,
                  }}
                  onPress={() =>
                    openFoodDetail(
                      food
                    )
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <FoodImage
                    food={food}
                    size={58}
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight:
                          "600",
                        color:
                          "#333",
                      }}
                      numberOfLines={
                        1
                      }
                    >
                      {getFoodName(
                        food
                      )}
                    </Text>

                    {getFoodEnglishName(
                      food
                    ) ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color:
                            "#999",
                          marginTop:
                            1,
                        }}
                        numberOfLines={
                          1
                        }
                      >
                        {getFoodEnglishName(
                          food
                        )}
                      </Text>
                    ) : null}

                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          ORANGE,
                        fontWeight:
                          "600",
                        marginTop:
                          2,
                      }}
                    >
                      {
                        nutrition.kcal
                      }{" "}
                      kcal
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#ccc"
                  />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* =====================================================
          FOOD DETAIL MODAL
      ===================================================== */}

      <Modal
        visible={
          showFoodDetail
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={
          closeFoodDetail
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor:
              "#fff",
          }}
        >
          <View
            style={
              st.detailHeader
            }
          >
            <TouchableOpacity
              onPress={
                closeFoodDetail
              }
            >
              <Ionicons
                name="close"
                size={28}
                color="#333"
              />
            </TouchableOpacity>

            <Text
              style={
                st.detailHeaderTitle
              }
            >
              รายละเอียดอาหาร
            </Text>

            <View
              style={{
                width: 28,
              }}
            />
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 40,
            }}
          >
            {selectedFood && (
              <>
                {/* BIG IMAGE */}

                <View
                  style={
                    st.detailImageWrapper
                  }
                >
                  <FoodImage
                    food={
                      selectedFood
                    }
                    size={220}
                  />
                </View>

                {/* NAME */}

                <View
                  style={{
                    marginTop: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 23,
                      fontWeight:
                        "bold",
                      color:
                        "#222",
                    }}
                  >
                    {getFoodName(
                      selectedFood
                    )}
                  </Text>

                  {getFoodEnglishName(
                    selectedFood
                  ) && (
                    <Text
                      style={{
                        fontSize: 14,
                        color:
                          "#999",
                        marginTop: 4,
                      }}
                    >
                      {getFoodEnglishName(
                        selectedFood
                      )}
                    </Text>
                  )}
                </View>

                {/* NUTRITION */}

                <Text
                  style={
                    st.sectionTitle
                  }
                >
                  สารอาหาร
                </Text>

                <View
                  style={
                    st.nutritionGrid
                  }
                >
                  <View
                    style={
                      st.nutritionBox
                    }
                  >
                    <Text
                      style={
                        st.nutritionLabel
                      }
                    >
                      พลังงาน
                    </Text>

                    <Text
                      style={
                        st.nutritionValueOrange
                      }
                    >
                      {
                        getNutrition(
                          selectedFood
                        ).kcal
                      }
                    </Text>

                    <Text
                      style={
                        st.nutritionUnit
                      }
                    >
                      kcal
                    </Text>
                  </View>

                  <View
                    style={
                      st.nutritionBox
                    }
                  >
                    <Text
                      style={
                        st.nutritionLabel
                      }
                    >
                      โปรตีน
                    </Text>

                    <Text
                      style={[
                        st.nutritionValue,
                        {
                          color:
                            "#3B82F6",
                        },
                      ]}
                    >
                      {
                        getNutrition(
                          selectedFood
                        ).protein
                      }
                    </Text>

                    <Text
                      style={
                        st.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>

                  <View
                    style={
                      st.nutritionBox
                    }
                  >
                    <Text
                      style={
                        st.nutritionLabel
                      }
                    >
                      คาร์บ
                    </Text>

                    <Text
                      style={[
                        st.nutritionValue,
                        {
                          color:
                            "#F59E0B",
                        },
                      ]}
                    >
                      {
                        getNutrition(
                          selectedFood
                        ).carbs
                      }
                    </Text>

                    <Text
                      style={
                        st.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>

                  <View
                    style={
                      st.nutritionBox
                    }
                  >
                    <Text
                      style={
                        st.nutritionLabel
                      }
                    >
                      ไขมัน
                    </Text>

                    <Text
                      style={[
                        st.nutritionValue,
                        {
                          color:
                            "#EF4444",
                        },
                      ]}
                    >
                      {
                        getNutrition(
                          selectedFood
                        ).fat
                      }
                    </Text>

                    <Text
                      style={
                        st.nutritionUnit
                      }
                    >
                      g
                    </Text>
                  </View>

                  {getNutrition(
                    selectedFood
                  ).fiber >
                    0 && (
                    <View
                      style={
                        st.nutritionBox
                      }
                    >
                      <Text
                        style={
                          st.nutritionLabel
                        }
                      >
                        ใยอาหาร
                      </Text>

                      <Text
                        style={[
                          st.nutritionValue,
                          {
                            color:
                              "#22A06B",
                          },
                        ]}
                      >
                        {
                          getNutrition(
                            selectedFood
                          ).fiber
                        }
                      </Text>

                      <Text
                        style={
                          st.nutritionUnit
                        }
                      >
                        g
                      </Text>
                    </View>
                  )}

                  {getNutrition(
                    selectedFood
                  ).sodium >
                    0 && (
                    <View
                      style={
                        st.nutritionBox
                      }
                    >
                      <Text
                        style={
                          st.nutritionLabel
                        }
                      >
                        โซเดียม
                      </Text>

                      <Text
                        style={[
                          st.nutritionValue,
                          {
                            color:
                              "#8B5CF6",
                          },
                        ]}
                      >
                        {
                          getNutrition(
                            selectedFood
                          ).sodium
                        }
                      </Text>

                      <Text
                        style={
                          st.nutritionUnit
                        }
                      >
                        mg
                      </Text>
                    </View>
                  )}
                </View>

                {/* PORTION */}

                {selectedFood
                  ?.portion && (
                  <>
                    <Text
                      style={
                        st.sectionTitle
                      }
                    >
                      ปริมาณต่อหนึ่งหน่วย
                    </Text>

                    <View
                      style={
                        st.portionBox
                      }
                    >
                      <Ionicons
                        name="scale-outline"
                        size={22}
                        color={
                          ORANGE
                        }
                      />

                      <Text
                        style={
                          st.portionText
                        }
                      >
                        {selectedFood
                          ?.portion
                          ?.gram
                          ? `${selectedFood.portion.gram} กรัม`
                          : ""}

                        {selectedFood
                          ?.portion
                          ?.unit
                          ? ` / ${selectedFood.portion.unit}`
                          : ""}
                      </Text>
                    </View>
                  </>
                )}

                {/* INGREDIENTS */}

                <Text
                  style={
                    st.sectionTitle
                  }
                >
                  ส่วนผสม
                </Text>

                {getIngredients(
                  selectedFood
                ).length >
                0 ? (
                  <View
                    style={
                      st.ingredientsBox
                    }
                  >
                    {getIngredients(
                      selectedFood
                    ).map(
                      (
                        ingredient,
                        index
                      ) => {
                        const text =
                          formatIngredient(
                            ingredient
                          );

                        if (
                          !text
                        ) {
                          return null;
                        }

                        return (
                          <View
                            key={
                              `${ingredient?.ingredient_id || "ingredient"}-${index}`
                            }
                            style={
                              st.ingredientRow
                            }
                          >
                            <View
                              style={
                                st.ingredientDot
                              }
                            />

                            <Text
                              style={
                                st.ingredientText
                              }
                            >
                              {text}
                            </Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                ) : (
                  <View
                    style={
                      st.emptyIngredientBox
                    }
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={28}
                      color="#ccc"
                    />

                    <Text
                      style={{
                        marginTop: 8,
                        color:
                          "#999",
                      }}
                    >
                      ไม่มีข้อมูลส่วนผสม
                    </Text>
                  </View>
                )}

                {/* REPLACE BUTTON */}

                {selSlot &&
                  selectedFood?._id && (
                    <TouchableOpacity
                      style={
                        st.replaceDetailBtn
                      }
                      onPress={() =>
                        doReplace(
                          String(
                            selectedFood._id
                          )
                        )
                      }
                      activeOpacity={
                        0.8
                      }
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={22}
                        color="#fff"
                      />

                      <Text
                        style={
                          st.replaceDetailText
                        }
                      >
                        เปลี่ยนเป็นเมนูนี้
                      </Text>
                    </TouchableOpacity>
                  )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const st =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    header: {
      height: 56,
      backgroundColor:
        ORANGE,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight:
        "bold",
      color: "#fff",
      fontFamily: "System",
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 40,
    },

    emptyTitle: {
      fontSize: 22,
      fontWeight:
        "bold",
      marginTop: 20,
      color: "#333",
    },

    emptyText: {
      fontSize: 15,
      color: "#999",
      textAlign:
        "center",
      marginTop: 10,
      lineHeight: 22,
    },

    createBtn: {
      marginTop: 30,
      backgroundColor:
        ORANGE,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 32,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    createBtnText: {
      color: "#fff",
      fontSize: 18,
      fontWeight:
        "bold",
    },

    tabBar: {
      flexDirection:
        "row",
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems:
        "center",
    },

    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor:
        ORANGE,
    },

    tabText: {
      fontSize: 15,
      color: "#999",
      fontWeight:
        "600",
    },

    tabTextActive: {
      color: ORANGE,
      fontWeight:
        "bold",
    },

    summaryCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: "#FF6B00",
    },

    progressBar: {
      height: 10,
      backgroundColor:
        "#eee",
      borderRadius: 5,
      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        ORANGE,
      borderRadius: 5,
    },

    mealCard: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#eee",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },

    actionBtn: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor:
        "#f8f8f8",
    },

    outlineBtn: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor:
        "#000",
      backgroundColor: "#fff",
    },

    dangerBtn: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor:
        "#EF4444",
    },

    dayTab: {
      width: 58,
      height: 62,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#eee",
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
    },

    dayTabActive: {
      backgroundColor:
        ORANGE,
      borderColor:
        ORANGE,
    },

    /* =====================================================
       DETAIL
    ===================================================== */

    detailHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    detailHeaderTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#333",
    },

    detailImageWrapper: {
      width: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#333",
      marginTop: 24,
      marginBottom: 12,
    },

    nutritionGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    nutritionBox: {
      width: "47%",
      backgroundColor:
        "#FFF8E8",
      borderRadius: 12,
      padding: 14,
      alignItems:
        "center",
    },

    nutritionLabel: {
      fontSize: 13,
      color: "#777",
    },

    nutritionValueOrange: {
      fontSize: 23,
      fontWeight:
        "bold",
      color: ORANGE,
      marginTop: 4,
    },

    nutritionValue: {
      fontSize: 23,
      fontWeight:
        "bold",
      marginTop: 4,
    },

    nutritionUnit: {
      fontSize: 12,
      color: "#999",
    },

    portionBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFF8E8",
      borderRadius: 12,
      padding: 14,
      gap: 10,
    },

    portionText: {
      flex: 1,
      fontSize: 15,
      color: "#555",
      fontWeight:
        "600",
    },

    ingredientsBox: {
      backgroundColor:
        "#f8f8f8",
      borderRadius: 12,
      padding: 14,
    },

    ingredientRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 10,
    },

    ingredientDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        ORANGE,
      marginTop: 6,
      marginRight: 10,
    },

    ingredientText: {
      flex: 1,
      fontSize: 14,
      color: "#555",
      lineHeight: 20,
    },

    emptyIngredientBox: {
      backgroundColor:
        "#f8f8f8",
      borderRadius: 12,
      paddingVertical: 30,
      alignItems:
        "center",
    },

    replaceDetailBtn: {
      marginTop: 28,
      backgroundColor:
        ORANGE,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    replaceDetailText: {
      color: "#fff",
      fontSize: 16,
      fontWeight:
        "bold",
    },
  });