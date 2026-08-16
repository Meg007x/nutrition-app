import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PlanScreen() {
<<<<<<< Updated upstream
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Plan Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { fontSize: 24, fontWeight: "800" },
});
=======
  const params =
    useLocalSearchParams<{
      refresh?: string;
      plan_id?: string;
    }>();

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
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    deletingPlanId,
    setDeletingPlanId,
  ] = useState<string | null>(
    null
  );

  const [
    userId,
    setUserId,
  ] = useState("");

  // ====================================================
  // Group Plans By plan_id
  // ====================================================

  const groupedPlans =
    useMemo(() => {
      const groups = new Map<
        string,
        DailyPlan[]
      >();

      plans.forEach((plan) => {
        if (
          !groups.has(plan.plan_id)
        ) {
          groups.set(
            plan.plan_id,
            []
          );
        }

        groups
          .get(plan.plan_id)!
          .push(plan);
      });

      return Array.from(
        groups.entries()
      ).map(
        ([plan_id, days]) => ({
          plan_id,
          days: days.sort(
            (a, b) =>
              new Date(
                a.date
              ).getTime() -
              new Date(
                b.date
              ).getTime()
          ),
        })
      );
    }, [plans]);

  // ====================================================
  // Focus
  // ====================================================

  useFocusEffect(
    useCallback(() => {
      console.log(
        "================================"
      );

      console.log(
        "🔄 PLAN SCREEN FOCUSED"
      );

      console.log(
        "REFRESH PARAM:",
        params.refresh
      );

      console.log(
        "PLAN ID PARAM:",
        params.plan_id
      );

      console.log(
        "================================"
      );

      loadPlan();

      return () => {
        console.log(
          "👋 PLAN SCREEN UNFOCUSED"
        );
      };
    }, [
      params.refresh,
      params.plan_id,
    ])
  );

  // ====================================================
  // Get User ID
  // ====================================================

  async function getUserId(): Promise<
    string | null
  > {
    try {
      // 🔧 1) เช็ก AsyncStorage key "user_id" ก่อน
      const storedUserId =
        await AsyncStorage.getItem(
          "user_id"
        );

      console.log(
        "📦 AsyncStorage user_id:",
        storedUserId
      );

      if (storedUserId) {
        console.log(
          "✅ ใช้ user_id จาก AsyncStorage:",
          storedUserId
        );

        return storedUserId;
      }

      // 🔧 2) Fallback: เช็ก key "currentUser" (แบบเดียวกับ dashboard)
      const currentUserRaw =
        await AsyncStorage.getItem(
          "currentUser"
        );

      if (currentUserRaw) {
        const currentUser =
          JSON.parse(currentUserRaw);

        const fallbackId =
          currentUser?.user_id ||
          currentUser?.id ||
          null;

        if (fallbackId) {
          console.log(
            "✅ ใช้ user_id จาก currentUser:",
            fallbackId
          );

          // บันทึกกลับ key "user_id" ไว้ใช้ครั้งถัดไป
          await AsyncStorage.setItem(
            "user_id",
            String(fallbackId)
          );

          return String(fallbackId);
        }
      }

      console.log(
        "⚠️ AsyncStorage ไม่มี user_id"
      );

      console.log(
        "📡 กำลังโหลด User Profile..."
      );

      // 🔧 3) Fallback สุดท้าย: เรียก API /users/profile พร้อม userId
      //    (ต้องมี userId ถึงจะเรียกได้ ไม่งั้นจะ 400)
      //    ดังนั้นถ้าไม่มี userId เลย ให้ return null
      console.error(
        "❌ ไม่พบ user_id ใน AsyncStorage ทุก key — ไม่สามารถเรียก /api/users/profile ได้"
      );

      return null;
    } catch (error: any) {
      console.error(
        "❌ GET USER ID ERROR:",
        error
      );

      return null;
    }
  }

  // ====================================================
  // Load Plan
  // ====================================================

  async function loadPlan() {
    try {
      setLoading(true);

      console.log(
        "🔎 กำลังตรวจสอบ user_id..."
      );

      const currentUserId =
        await getUserId();

      console.log(
        "👤 FINAL USER ID:",
        currentUserId
      );

      if (!currentUserId) {
        console.log(
          "❌ ไม่สามารถหา user_id ได้"
        );

        setPlans([]);

        return;
      }

      setUserId(
        currentUserId
      );

      const url =
        `${BASE_URL}/api/meal/user/${currentUserId}`;

      console.log(
        "================================"
      );

      console.log(
        "📤 GET USER PLANS"
      );

      console.log(
        "USER ID:",
        currentUserId
      );

      console.log(
        "URL:",
        url
      );

      console.log(
        "================================"
      );

      const response =
        await axios.get(
          url,
          {
            timeout: 30000,
          }
        );

      console.log(
        "📥 PLAN RESPONSE:",
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

      const newPlans =
        Array.isArray(
          response.data?.plans
        )
          ? response.data.plans
          : [];

      console.log(
        "📋 PLANS COUNT:",
        newPlans.length
      );

      if (
        newPlans.length > 0
      ) {
        console.log(
          "📋 PLAN LIST:"
        );

        newPlans.forEach(
          (
            plan: DailyPlan,
            index: number
          ) => {
            console.log(
              `${index + 1}.`,
              plan.plan_id,
              plan.date
            );
          }
        );
      }

      setPlans(
        newPlans
      );
    } catch (error: any) {
      console.error(
        "❌ LOAD PLAN ERROR:",
        error
      );

      if (
        axios.isAxiosError(error)
      ) {
        console.error(
          "❌ STATUS:",
          error.response?.status
        );

        console.error(
          "❌ RESPONSE DATA:",
          error.response?.data
        );
      }

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
      setRefreshing(false);
    }
  }

  // ====================================================
  // Delete Plan
  // ====================================================

  function confirmDeletePlan(
    plan: DailyPlan
  ) {
    console.log(
      "🗑️ CONFIRM DELETE PLAN"
    );

    console.log(
      "PLAN ID:",
      plan.plan_id
    );

    console.log(
      "PLATFORM:",
      Platform.OS
    );

    console.log(
      "DELETING PLAN ID:",
      deletingPlanId
    );

    if (
      deletingPlanId
    ) {
      console.log(
        "⚠️ กำลังลบอยู่ ไม่ทำอะไร"
      );

      return;
    }

    // ==================================================
    // Web: ใช้ window.confirm()
    // เนื่องจาก Alert.alert() callback
    // ไม่ทำงานบน React Native Web
    // ==================================================

    if (
      Platform.OS === "web"
    ) {
      const message =
        `ต้องการลบแผนวันที่ ${plan.date} หรือไม่?\n\nแผนนี้มีทั้งหมด ${getPlanDayCount(
          plan.plan_id
        )} วัน และจะถูกลบทั้งหมด`;

      const confirmed =
        window.confirm(
          message
        );

      if (confirmed) {
        console.log(
          "✅ USER CONFIRMED DELETE:",
          plan.plan_id
        );

        deletePlan(
          plan.plan_id
        );
      } else {
        console.log(
          "❌ USER CANCELLED DELETE"
        );
      }

      return;
    }

    // ==================================================
    // Android / iOS: ใช้ Alert.alert()
    // ==================================================

    Alert.alert(
      "ลบแผนอาหาร",
      `ต้องการลบแผนวันที่ ${plan.date} หรือไม่?\n\nแผนนี้มีทั้งหมด ${getPlanDayCount(
        plan.plan_id
      )} วัน และจะถูกลบทั้งหมด`,
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบแผน",
          style: "destructive",
          onPress: () => {
            console.log(
              "✅ USER CONFIRMED DELETE:",
              plan.plan_id
            );

            deletePlan(
              plan.plan_id
            );
          },
        },
      ]
    );
  }

  // ====================================================
  // Get Number of Days
  // ====================================================

  function getPlanDayCount(
    planId: string
  ) {
    return plans.filter(
      (item) =>
        item.plan_id ===
        planId
    ).length;
  }

  // ====================================================
  // Delete API
  // ====================================================

  async function deletePlan(
    planId: string
  ) {
    try {
      console.log(
        "================================"
      );

      console.log(
        "🗑️ DELETE PLAN START"
      );

      console.log(
        "PLAN ID:",
        planId
      );

      console.log(
        "PLAN ID TYPE:",
        typeof planId
      );

      console.log(
        "================================"
      );

      setDeletingPlanId(
        planId
      );

      const url =
        `${BASE_URL}/api/meal/plans/${encodeURIComponent(
          planId
        )}`;

      console.log(
        "📤 DELETE URL:",
        url
      );

      const response =
        await axios.delete(
          url,
          {
            timeout: 30000,
          }
        );

      console.log(
        "📥 DELETE RESPONSE STATUS:",
        response.status
      );

      console.log(
        "📥 DELETE RESPONSE DATA:",
        JSON.stringify(
          response.data
        )
      );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "ลบแผนไม่สำเร็จ"
        );
      }

      const deletedCount =
        response.data
          ?.deleted_count ?? 0;

      console.log(
        "✅ DELETED COUNT:",
        deletedCount
      );

      // ==================================================
      // ลบออกจาก UI ทันที
      // ==================================================

      setPlans(
        (currentPlans) => {
          const filtered =
            currentPlans.filter(
              (item) =>
                item.plan_id !==
                planId
            );

          console.log(
            "📋 PLANS BEFORE FILTER:",
            currentPlans.length
          );

          console.log(
            "📋 PLANS AFTER FILTER:",
            filtered.length
          );

          return filtered;
        }
      );

      Alert.alert(
        "ลบสำเร็จ",
        `ลบแผนอาหารสำเร็จ\nลบทั้งหมด ${deletedCount} วัน`
      );
    } catch (error: any) {
      console.error(
        "================================"
      );

      console.error(
        "❌ DELETE PLAN ERROR"
      );

      console.error(
        "ERROR MESSAGE:",
        error?.message
      );

      console.error(
        "ERROR TYPE:",
        error?.code
      );

      if (
        axios.isAxiosError(error)
      ) {
        console.error(
          "❌ AXIOS ERROR STATUS:",
          error.response?.status
        );

        console.error(
          "❌ AXIOS ERROR DATA:",
          JSON.stringify(
            error.response?.data
          )
        );

        console.error(
          "❌ AXIOS ERROR URL:",
          error.config?.url
        );

        console.error(
          "❌ AXIOS ERROR METHOD:",
          error.config?.method
        );
      }

      console.error(
        "================================"
      );

      const message =
        axios.isAxiosError(error)
          ? error.response?.data
              ?.message ||
            error.message
          : error?.message ||
            "ไม่สามารถลบแผนอาหารได้";

      Alert.alert(
        "ลบแผนไม่สำเร็จ",
        message
      );
    } finally {
      console.log(
        "🔄 DELETE PLAN FINALLY"
      );

      setDeletingPlanId(
        null
      );
    }
  }

  // ====================================================
  // Refresh
  // ====================================================

  async function handleRefresh() {
    setRefreshing(
      true
    );

    await loadPlan();
  }

  // ====================================================
  // Open Plan
  // ====================================================

  function openPlan(
    group: GroupedPlan
  ) {
    router.push({
      pathname:
        "/create-plan/step2",

      params: {
        plan_id:
          group.plan_id,

        startDate:
          group.days[0].date,

        endDate:
          group.days[
            group.days.length - 1
          ].date,

        days: String(
          group.days.length
        ),
      },
    });
  }

  // ====================================================
  // Loading
  // ====================================================

  if (
    loading &&
    plans.length === 0
  ) {
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
      {/* Header */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.headerTitle
          }
        >
          แผนการกิน
        </Text>

        <TouchableOpacity
          onPress={() =>
            loadPlan()
          }
          disabled={
            !!deletingPlanId
          }
        >
          <Ionicons
            name="refresh"
            size={26}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* Content */}

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        <View
          style={
            styles.titleContainer
          }
        >
          <Text
            style={
              styles.title
            }
          >
            แผนอาหารของฉัน
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            แผนที่บันทึกไว้
          </Text>
        </View>

        {/* Empty */}

        {plans.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Ionicons
              name="restaurant-outline"
              size={70}
              color="#bbb"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              ยังไม่มีแผนอาหาร
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              สร้างแผนอาหารของคุณ
              เพื่อเริ่มต้น
            </Text>

            <TouchableOpacity
              style={
                styles.createButton
              }
              onPress={() =>
                router.push(
                  "/create-plan/step1"
                )
              }
            >
              <Text
                style={
                  styles.createButtonText
                }
              >
                สร้างแผนอาหาร
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Count */}

            <View
              style={
                styles.countCard
              }
            >
              <Text
                style={
                  styles.countTitle
                }
              >
                แผนที่บันทึกไว้
              </Text>

              <Text
                style={
                  styles.countNumber
                }
              >
                {
                  groupedPlans.length
                }
              </Text>

              <Text
                style={
                  styles.countText
                }
              >
                แผน
              </Text>
            </View>

            {/* Plan Cards */}

            {groupedPlans.map(
              (
                group
              ) => {
                const isDeleting =
                  deletingPlanId ===
                  group.plan_id;

                const firstDay =
                  group.days[0];

                const lastDay =
                  group.days[
                    group.days
                      .length - 1
                  ];

                return (
                  <View
                    key={group.plan_id}
                    style={
                      styles.planCard
                    }
                  >
                    {/* Click Area */}

                    <TouchableOpacity
                      onPress={() =>
                        openPlan(
                          group
                        )
                      }
                      disabled={
                        isDeleting
                      }
                      activeOpacity={
                        0.7
                      }
                    >
                      {/* Header */}

                      <View
                        style={
                          styles.planHeader
                        }
                      >
                        <View
                          style={
                            styles.planHeaderInfo
                          }
                        >
                          <Text
                            style={
                              styles.planDate
                            }
                          >
                            {firstDay.date}{" "}
                            ถึง{" "}
                            {lastDay.date}
                          </Text>

                          <Text
                            style={
                              styles.planGoal
                            }
                          >
                            เป้าหมาย:{" "}
                            {
                              firstDay.goal ||
                              "-"
                            }
                            {" · "}
                            {group.days.length}{" "}
                            วัน
                          </Text>

                          <Text
                            style={
                              styles.planId
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {group.plan_id}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={24}
                          color="#999"
                        />
                      </View>

                      {/* Calories */}

                      <View
                        style={
                          styles.kcalBox
                        }
                      >
                        <Ionicons
                          name="flame-outline"
                          size={24}
                          color="#666"
                        />

                        <View
                          style={
                            styles.kcalInfo
                          }
                        >
                          <Text
                            style={
                              styles.kcalLabel
                            }
                          >
                            พลังงานต่อวัน
                          </Text>

                          <Text
                            style={
                              styles.kcalValue
                            }
                          >
                            {
                              firstDay
                                .daily_target_summary
                                ?.kcal ??
                              0
                            }{" "}
                            kcal
                          </Text>
                        </View>
                      </View>

                      {/* Macros */}

                      <View
                        style={
                          styles.macroRow
                        }
                      >
                        <View
                          style={
                            styles.macroItem
                          }
                        >
                          <Text
                            style={
                              styles.macroLabel
                            }
                          >
                            Protein
                          </Text>

                          <Text
                            style={
                              styles.macroValue
                            }
                          >
                            {
                              firstDay
                                .daily_target_summary
                                ?.protein_g ??
                              0
                            }{" "}
                            g
                          </Text>
                        </View>

                        <View
                          style={
                            styles.macroItem
                          }
                        >
                          <Text
                            style={
                              styles.macroLabel
                            }
                          >
                            Carbs
                          </Text>

                          <Text
                            style={
                              styles.macroValue
                            }
                          >
                            {
                              firstDay
                                .daily_target_summary
                                ?.carb_g ??
                              0
                            }{" "}
                            g
                          </Text>
                        </View>

                        <View
                          style={
                            styles.macroItem
                          }
                        >
                          <Text
                            style={
                              styles.macroLabel
                            }
                          >
                            Fat
                          </Text>

                          <Text
                            style={
                              styles.macroValue
                            }
                          >
                            {
                              firstDay
                                .daily_target_summary
                                ?.fat_g ??
                              0
                            }{" "}
                            g
                          </Text>
                        </View>
                      </View>

                      {/* Meals */}

                      <View
                        style={
                          styles.mealPreview
                        }
                      >
                        {firstDay.slots?.map(
                          (
                            slot,
                            slotIndex
                          ) => (
                            <View
                              key={`${slot.meal_type}-${slotIndex}`}
                              style={
                                styles.mealRow
                              }
                            >
                              <Ionicons
                                name="restaurant-outline"
                                size={18}
                                color="#666"
                              />

                              <Text
                                style={
                                  styles.mealName
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  slot.slot_name
                                }
                                :{" "}
                                {
                                  slot
                                    .main_food
                                    ?.name ||
                                  "ไม่มีเมนู"
                                }
                              </Text>
                            </View>
                          )
                        )}
                      </View>

                      {/* Status */}

                      <View
                        style={
                          styles.statusRow
                        }
                      >
                        <View
                          style={
                            styles.statusDot
                          }
                        />

                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          แผนใช้งานอยู่ ·{" "}
                          {group.days.length}{" "}
                          วัน
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Delete Button */}

                    <TouchableOpacity
                      style={
                        styles.deleteButton
                      }
                      onPress={() =>
                        confirmDeletePlan(
                          firstDay
                        )
                      }
                      disabled={
                        !!deletingPlanId
                      }
                    >
                      {isDeleting ? (
                        <ActivityIndicator
                          size="small"
                          color="#fff"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#fff"
                          />

                          <Text
                            style={
                              styles.deleteButtonText
                            }
                          >
                            ลบแผนนี้
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }
            )}
          </>
        )}
      </ScrollView>
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
      backgroundColor:
        "#fff",
    },

    header: {
      height: 60,
      backgroundColor:
        "#F29913",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal:
        20,
    },

    headerTitle: {
      fontSize: 24,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    titleContainer: {
      marginBottom: 20,
    },

    title: {
      fontSize: 26,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    subtitle: {
      marginTop: 5,
      color: "#777",
      fontSize: 14,
      fontFamily: "NotoSansThai",
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: "#555",
      fontFamily: "NotoSansThai",
    },

    emptyContainer: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingTop: 80,
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 20,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    emptyText: {
      marginTop: 8,
      color: "#777",
      fontFamily: "NotoSansThai",
    },

    createButton: {
      marginTop: 20,
      backgroundColor:
        "#F29913",
      paddingHorizontal:
        25,
      paddingVertical:
        14,
      borderRadius: 12,
    },

    createButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    countCard: {
      backgroundColor:
        "#F8F8F8",
      borderRadius: 15,
      padding: 18,
      marginBottom: 15,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    countTitle: {
      fontSize: 16,
      fontWeight:
        "600",
      flex: 1,
      fontFamily: "NotoSansThaiBold",
    },

    countNumber: {
      fontSize: 28,
      fontWeight:
        "bold",
      color: "#333",
      fontFamily: "NotoSansThaiBold",
    },

    countText: {
      marginLeft: 5,
      color: "#777",
      fontFamily: "NotoSansThai",
    },

    planCard: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 16,
      padding: 16,
      marginBottom: 15,

      shadowColor:
        "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.08,

      shadowRadius: 5,

      elevation: 2,
    },

    planHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    planHeaderInfo: {
      flex: 1,
      paddingRight: 10,
    },

    planDate: {
      fontSize: 19,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    planGoal: {
      marginTop: 5,
      color: "#777",
      fontSize: 13,
      fontFamily: "NotoSansThai",
    },

    planId: {
      marginTop: 4,
      color: "#aaa",
      fontSize: 10,
      fontFamily: "NotoSansThai",
    },

    kcalBox: {
      marginTop: 15,
      padding: 12,
      borderRadius: 12,
      backgroundColor:
        "#F8F8F8",
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    kcalInfo: {
      marginLeft: 10,
    },

    kcalLabel: {
      fontSize: 12,
      color: "#777",
      fontFamily: "NotoSansThai",
    },

    kcalValue: {
      marginTop: 2,
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#333",
      fontFamily: "NotoSansThaiBold",
    },

    macroRow: {
      flexDirection:
        "row",
      marginTop: 15,
    },

    macroItem: {
      flex: 1,
      alignItems:
        "center",
    },

    macroLabel: {
      fontSize: 12,
      color: "#777",
      fontFamily: "NotoSansThai",
    },

    macroValue: {
      marginTop: 4,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },

    mealPreview: {
      marginTop: 15,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        "#eee",
    },

    mealRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 7,
    },

    mealName: {
      marginLeft: 8,
      flex: 1,
      fontSize: 14,
      fontFamily: "NotoSansThai",
    },

    statusRow: {
      marginTop: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      backgroundColor:
        "#22C55E",
    },

    statusText: {
      marginLeft: 7,
      fontSize: 12,
      color: "#22C55E",
      fontFamily: "NotoSansThai",
    },

    deleteButton: {
      marginTop: 15,
      height: 46,
      borderRadius: 12,
      backgroundColor:
        "#EF4444",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    deleteButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight:
        "bold",
      fontFamily: "NotoSansThaiBold",
    },
  });
>>>>>>> Stashed changes
