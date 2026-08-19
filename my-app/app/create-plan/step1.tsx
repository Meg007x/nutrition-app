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
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BASE_URL } from "../../constants/config";

// ======================================================
// Helpers
// ======================================================

function formatDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year = date.getFullYear();

  return `${day} / ${month} / ${year}`;
}

function getDayDifference(
  start: Date,
  end: Date
): number {
  const startDate = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endDate = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  const difference =
    endDate.getTime() -
    startDate.getTime();

  return (
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

// ======================================================
// Types
// ======================================================

type UserProfile = {
  user_id: string;

  username?: string;

  email?: string;

  gender?: string;

  height_cm?: number;

  weight_kg?: number;

  health_goals?: {
    primary_goal?: string;
    target_weight_kg?: number;
    duration_weeks?: number;
    activity_level?: string;
    protein_target_g?: number;
    tdee_target_kcal?: number;
  };

  allergies?:
    | Record<string, string[]>
    | string[];

  disliked_foods?:
    | Record<string, string[]>
    | string[];
};

// ======================================================
// Component
// ======================================================

export default function Step1Screen() {
  const [startDate, setStartDate] =
    useState<Date>(new Date());

  const [endDate, setEndDate] =
    useState<Date>(() => {
      const date = new Date();

      date.setDate(
        date.getDate() + 6
      );

      return date;
    });

  const [
    showStartPicker,
    setShowStartPicker,
  ] = useState(false);

  const [
    showEndPicker,
    setShowEndPicker,
  ] = useState(false);

  const [creating, setCreating] =
    useState(false);

  const [
    userProfile,
    setUserProfile,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    loadingUser,
    setLoadingUser,
  ] = useState(true);

  // ====================================================
  // Load User Profile
  // ====================================================

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      setLoadingUser(true);

      console.log(
        "================================"
      );

      console.log(
        "👤 LOAD USER PROFILE"
      );

      const raw =
        await AsyncStorage.getItem(
          "currentUser"
        );

      console.log(
        "📦 currentUser:",
        raw
      );

      if (!raw) {
        Alert.alert(
          "ไม่พบผู้ใช้",
          "กรุณาเข้าสู่ระบบก่อนสร้างแผน",
          [
            {
              text: "ตกลง",
              onPress: () =>
                router.replace(
                  "/login"
                ),
            },
          ]
        );

        return;
      }

      let storedUser: any;

      try {
        storedUser =
          JSON.parse(raw);
      } catch {
        throw new Error(
          "ข้อมูล currentUser ไม่ถูกต้อง"
        );
      }

      const userId =
        storedUser?.user_id ||
        storedUser?.uid ||
        storedUser?.id ||
        storedUser?.email;

      console.log(
        "👤 USER ID:",
        userId
      );

      if (!userId) {
        throw new Error(
          "ไม่พบ user_id ในข้อมูลผู้ใช้"
        );
      }

      // ==================================================
      // Fetch Backend Profile
      // ==================================================

      try {
        console.log(
          "📡 GET USER PROFILE"
        );

        console.log(
          "URL:",
          `${BASE_URL}/api/users/profile`
        );

        const response =
          await axios.get(
            `${BASE_URL}/api/users/profile`,
            {
              params: {
                userId,
              },

              timeout: 15000,
            }
          );

        console.log(
          "📥 PROFILE RESPONSE:",
          response.data
        );

        const profile =
          response.data?.data ||
          response.data?.user ||
          response.data;

        if (
          profile &&
          typeof profile ===
            "object"
        ) {
          const mergedProfile = {
            ...storedUser,
            ...profile,
            user_id:
              profile.user_id ||
              userId,
          };

          setUserProfile(
            mergedProfile
          );

          console.log(
            "✅ ใช้ข้อมูล User จาก Backend"
          );

          console.log(
            "PROFILE:",
            mergedProfile
          );

          return;
        }
      } catch (profileError) {
        console.warn(
          "⚠️ โหลด Profile จาก Backend ไม่สำเร็จ"
        );

        if (
          axios.isAxiosError(
            profileError
          )
        ) {
          console.warn(
            "STATUS:",
            profileError.response
              ?.status
          );

          console.warn(
            "DATA:",
            profileError.response
              ?.data
          );
        }
      }

      // ==================================================
      // Fallback AsyncStorage
      // ==================================================

      console.log(
        "⚠️ ใช้ข้อมูล currentUser จาก AsyncStorage"
      );

      setUserProfile({
        ...storedUser,
        user_id: userId,
      });
    } catch (error) {
      console.error(
        "❌ Load user profile error:",
        error
      );

      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลผู้ใช้ได้"
      );
    } finally {
      setLoadingUser(false);

      console.log(
        "================================"
      );
    }
  }

  // ====================================================
  // Days
  // ====================================================

  const days = useMemo(
    () =>
      getDayDifference(
        startDate,
        endDate
      ),
    [startDate, endDate]
  );

  const isValid =
    days >= 1 &&
    days <= 7;

  // ====================================================
  // Start Date
  // ====================================================

  const handleStartDateChange = (
    event: any,
    selected?: Date
  ) => {
    setShowStartPicker(false);

    if (!selected) {
      return;
    }

    const newStart =
      new Date(selected);

    setStartDate(newStart);

    if (endDate < newStart) {
      setEndDate(newStart);
      return;
    }

    const maxEnd =
      new Date(newStart);

    maxEnd.setDate(
      maxEnd.getDate() + 6
    );

    if (
      getDayDifference(
        newStart,
        endDate
      ) > 7
    ) {
      setEndDate(maxEnd);
    }
  };

  // ====================================================
  // End Date
  // ====================================================

  const handleEndDateChange = (
    event: any,
    selected?: Date
  ) => {
    setShowEndPicker(false);

    if (!selected) {
      return;
    }

    const newEnd =
      new Date(selected);

    if (newEnd < startDate) {
      Alert.alert(
        "วันที่ไม่ถูกต้อง",
        "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น"
      );

      return;
    }

    if (
      getDayDifference(
        startDate,
        newEnd
      ) > 7
    ) {
      Alert.alert(
        "เลือกวันไม่ได้",
        "สามารถสร้างแผนได้สูงสุด 7 วัน"
      );

      return;
    }

    setEndDate(newEnd);
  };

  // ====================================================
  // Next
  // ====================================================

  const handleNext = async () => {
    console.log(
      "================================"
    );

    console.log(
      "🚀 STEP 1 NEXT"
    );

    console.log(
      "📅 START:",
      formatDate(startDate)
    );

    console.log(
      "📅 END:",
      formatDate(endDate)
    );

    console.log(
      "📅 DAYS:",
      days
    );

    console.log(
      "👤 PROFILE:",
      userProfile
    );

    // ==================================================
    // Validate
    // ==================================================

    if (!isValid) {
      Alert.alert(
        "วันที่ไม่ถูกต้อง",
        "กรุณาเลือกระยะเวลา 1-7 วัน"
      );

      return;
    }

    if (creating) {
      console.log(
        "⚠️ กำลังไปขั้นตอนถัดไปอยู่"
      );

      return;
    }

    if (loadingUser) {
      Alert.alert(
        "กำลังโหลดข้อมูล",
        "กรุณารอสักครู่"
      );

      return;
    }

    if (!userProfile) {
      Alert.alert(
        "ไม่พบข้อมูลผู้ใช้",
        "กรุณาเข้าสู่ระบบใหม่"
      );

      return;
    }

    try {
      setCreating(true);

      // ==================================================
      // Generate Plan
      // ==================================================

      const userId =
        userProfile.user_id;

      console.log(
        "📤 GENERATE PLAN"
      );

      console.log(
        "USER ID:",
        userId
      );

      console.log(
        "START:",
        formatDate(startDate)
      );

      console.log(
        "END:",
        formatDate(endDate)
      );

      console.log(
        "DAYS:",
        days
      );

      // ==================================================
      // Build Generate Payload
      // ==================================================

      const targetKcal =
        userProfile
          .health_goals
          ?.tdee_target_kcal ||
        2000;

      const goal =
        userProfile
          .health_goals
          ?.primary_goal ||
        "";

      // ==================================================
      // Calculate Nutrition Targets
      // ใช้ค่าจริงจาก user profile ถ้ามี
      // ถ้าไม่มี คำนวณจากสัดส่วนมาตรฐาน
      // ==================================================

      const proteinG =
        userProfile
          .health_goals
          ?.protein_target_g ||
        Math.round(
          (targetKcal * 0.15) / 4
        );

      const carbG = Math.round(
        (targetKcal * 0.5) / 4
      );

      const fatG = Math.round(
        (targetKcal * 0.3) / 9
      );

      const fiberG = 25;

      const sodiumMg = 2000;

      console.log(
        "📊 NUTRITION TARGETS:",
        {
          kcal: targetKcal,
          protein_g: proteinG,
          carb_g: carbG,
          fat_g: fatG,
          fiber_g: fiberG,
          sodium_mg: sodiumMg,
        }
      );

      // ==================================================
      // Allergies
      // ==================================================

      let allergiesList: string[] =
        [];

      if (
        userProfile.allergies
      ) {
        if (
          Array.isArray(
            userProfile.allergies
          )
        ) {
          allergiesList =
            userProfile.allergies;
        } else if (
          typeof userProfile.allergies ===
            "object"
        ) {
          Object.values(
            userProfile.allergies
          ).forEach(
            (arr) => {
              if (
                Array.isArray(arr)
              ) {
                allergiesList.push(
                  ...arr
                );
              }
            }
          );
        }
      }

      // ==================================================
      // Disliked Foods
      // ==================================================

      let dislikedList: string[] =
        [];

      if (
        userProfile.disliked_foods
      ) {
        if (
          Array.isArray(
            userProfile.disliked_foods
          )
        ) {
          dislikedList =
            userProfile.disliked_foods;
        } else if (
          typeof userProfile.disliked_foods ===
            "object"
        ) {
          Object.values(
            userProfile.disliked_foods
          ).forEach(
            (arr) => {
              if (
                Array.isArray(arr)
              ) {
                dislikedList.push(
                  ...arr
                );
              }
            }
          );
        }
      }

      // ==================================================
      // Payload
      // ==================================================

      const payload: Record<
        string,
        any
      > = {
        user_id: userId,

        start_date:
          formatDate(startDate),

        days: days,

        target_kcal: targetKcal,

        protein_g: proteinG,

        carb_g: carbG,

        fat_g: fatG,

        fiber_g: fiberG,

        sodium_mg: sodiumMg,

        goal: goal,
      };

      if (
        allergiesList.length > 0
      ) {
        payload.allergies =
          allergiesList;
      }

      if (
        dislikedList.length > 0
      ) {
        payload.disliked_foods =
          dislikedList;
      }

      console.log(
        "📦 PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      // ==================================================
      // Call Generate API
      // ==================================================

      console.log(
        "📤 POST:",
        `${BASE_URL}/api/meal/generate`
      );

      let planId = "";

      try {
        const response =
          await axios.post(
            `${BASE_URL}/api/meal/generate`,
            payload,
            {
              timeout: 120000,

              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        console.log(
          "📥 RESPONSE:",
          JSON.stringify(
            response.data,
            null,
            2
          )
        );

        // ==================================================
        // Validate Response
        // ==================================================

        if (
          response.data?.success &&
          response.data?.plan_id
        ) {
          planId =
            response.data.plan_id;

          console.log(
            "✅ PLAN CREATED"
          );

          console.log(
            "PLAN ID:",
            planId
          );

          console.log(
            "TOTAL DAYS:",
            response.data?.total_days
          );

          // ==================================================
          // Save Current Plan
          // ==================================================

          await AsyncStorage.setItem(
            "currentPlanId",
            String(planId)
          );
        } else {
          console.log(
            "⚠️ API สำเร็จแต่ไม่ได้ plan_id"
          );
        }
      } catch (apiError: any) {
        console.log(
          "⚠️ API call failed:",
          apiError.message
        );

        console.log(
          "➡️ ดำเนินการต่อไป step2"
        );
      }

      // ==================================================
      // Navigate Step 2
      // ==================================================

      console.log(
        "➡️ GO TO STEP 2"
      );

      const params: Record<
        string,
        string
      > = {
        startDate:
          formatDate(startDate),

        endDate:
          formatDate(endDate),

        days: String(days),
      };

      if (planId) {
        params.plan_id =
          String(planId);
      }

      router.push({
        pathname:
          "/create-plan/step2",

        params,
      });
    } catch (error: any) {
      console.error(
        "================================"
      );

      console.error(
        "❌ STEP 1 → STEP 2 ERROR"
      );

      console.error(
        error
      );

      console.error(
        "================================"
      );

      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถไปขั้นตอนถัดไปได้"
      );
    } finally {
      setCreating(false);

      console.log(
        "🔓 creating = false"
      );

      console.log(
        "================================"
      );
    }
  };

  // ====================================================
  // Loading
  // ====================================================

  if (loadingUser) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F29913"
        />

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
              styles.loadingUserText
            }
          >
            กำลังโหลดข้อมูลผู้ใช้...
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
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F29913"
      />

      {/* Header */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.headerButton
          }
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
          style={
            styles.headerButton
          }
        />
      </View>

      {/* Content */}

      <View
        style={styles.content}
      >
        <Text
          style={styles.title}
        >
          1. เลือกวันที่
        </Text>

        <Text
          style={styles.subtitle}
        >
          กรุณาเลือกระยะเวลาที่ต้องการ
          ในการสร้างแผนอาหาร
        </Text>

        {/* Start Date */}

        <Text
          style={styles.label}
        >
          วันที่เริ่มต้น
        </Text>

        <TouchableOpacity
          style={
            styles.dateButton
          }
          onPress={() =>
            setShowStartPicker(
              true
            )
          }
        >
          <Text
            style={styles.dateText}
          >
            {formatDisplayDate(
              startDate
            )}
          </Text>

          <Ionicons
            name="calendar-outline"
            size={24}
            color="#EF4444"
          />
        </TouchableOpacity>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={
              Platform.OS ===
              "ios"
                ? "spinner"
                : "default"
            }
            onChange={
              handleStartDateChange
            }
          />
        )}

        {/* End Date */}

        <Text
          style={[
            styles.label,
            {
              marginTop: 24,
            },
          ]}
        >
          วันที่สิ้นสุด
        </Text>

        <TouchableOpacity
          style={
            styles.dateButton
          }
          onPress={() =>
            setShowEndPicker(
              true
            )
          }
        >
          <Text
            style={styles.dateText}
          >
            {formatDisplayDate(
              endDate
            )}
          </Text>

          <Ionicons
            name="calendar-outline"
            size={24}
            color="#EF4444"
          />
        </TouchableOpacity>

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={
              startDate
            }
            maximumDate={
              new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate() +
                  6
              )
            }
            display={
              Platform.OS ===
              "ios"
                ? "spinner"
                : "default"
            }
            onChange={
              handleEndDateChange
            }
          />
        )}

        {/* Days */}

        <View
          style={
            styles.daysCard
          }
        >
          <View>
            <Text
              style={
                styles.daysLabel
              }
            >
              จำนวนวันที่เลือก
            </Text>

            <Text
              style={
                styles.daysHint
              }
            >
              เลือกได้สูงสุด 7 วัน
            </Text>
          </View>

          <Text
            style={
              styles.daysNumber
            }
          >
            {days} วัน
          </Text>
        </View>

        {!isValid && (
          <Text
            style={
              styles.errorText
            }
          >
            กรุณาเลือกระยะเวลา
            ระหว่าง 1-7 วัน
          </Text>
        )}
      </View>

      {/* Footer */}

      <View
        style={styles.footer}
      >
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!isValid ||
              creating) &&
              styles.disabledButton,
          ]}
          disabled={
            !isValid ||
            creating
          }
          onPress={handleNext}
        >
          {creating ? (
            <>
              <ActivityIndicator
                color="#fff"
                size="small"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                กำลังไปขั้นตอนถัดไป...
              </Text>
            </>
          ) : (
            <Text
              style={
                styles.nextButtonText
              }
            >
              ถัดไป
            </Text>
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
      backgroundColor: "#fff",
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },

    loadingUserText: {
      marginTop: 15,
      fontSize: 16,
      color: "#555",
    },

    header: {
      height: 60,
      backgroundColor: "#F29913",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
    },

    headerButton: {
      width: 40,
      height: 40,
      justifyContent:
        "center",
      alignItems: "center",
    },

    headerTitle: {
      fontSize: 23,
      fontWeight: "bold",
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 28,
    },

    title: {
      fontSize: 27,
      fontWeight: "bold",
    },

    subtitle: {
      marginTop: 8,
      marginBottom: 30,
      fontSize: 15,
      color: "#737373",
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },

    dateButton: {
      height: 54,
      borderWidth: 1,
      borderColor: "#222",
      borderRadius: 10,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    dateText: {
      fontSize: 16,
      fontWeight: "500",
    },

    daysCard: {
      marginTop: 30,
      padding: 18,
      borderRadius: 12,
      backgroundColor:
        "#FFF8E8",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    daysLabel: {
      fontSize: 16,
      fontWeight: "600",
    },

    daysHint: {
      marginTop: 4,
      fontSize: 13,
      color: "#777",
    },

    daysNumber: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#F29913",
    },

    errorText: {
      marginTop: 12,
      color: "#EF4444",
      fontSize: 14,
    },

    footer: {
      paddingHorizontal: 20,
      paddingBottom: 25,
    },

    nextButton: {
      height: 56,
      borderRadius: 12,
      backgroundColor:
        "#F9A800",
      justifyContent:
        "center",
      alignItems: "center",
      flexDirection: "row",
    },

    disabledButton: {
      opacity: 0.4,
    },

    nextButtonText: {
      color: "#fff",
      fontSize: 21,
      fontWeight: "bold",
    },

    loadingText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
  });