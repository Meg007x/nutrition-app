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
// Flatten Allergy / Disliked Foods
// ======================================================

function flattenObjectValues(
  obj:
    | Record<string, string[]>
    | string[]
    | undefined
    | null
): string[] {
  if (!obj) {
    return [];
  }

  // Backend ส่ง array มาอยู่แล้ว
  if (Array.isArray(obj)) {
    return obj
      .filter(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
      .map((item) => item.trim());
  }

  const result: string[] = [];

  for (const key of Object.keys(obj)) {
    const values = obj[key];

    if (Array.isArray(values)) {
      for (const item of values) {
        if (
          typeof item === "string" &&
          item.trim().length > 0
        ) {
          result.push(item.trim());
        }
      }
    }
  }

  return result;
}

// ======================================================
// Calculate Target Calories
// ======================================================

function calculateAdjustedKcal(
  tdee: number,
  primaryGoal: string
): number {
  const goal = String(
    primaryGoal || ""
  )
    .trim()
    .toLowerCase();

  // ลดน้ำหนัก
  if (
    goal === "ลดน้ำหนัก" ||
    goal === "lose_weight" ||
    goal === "ลดน้ำหนัก/ลดไขมัน"
  ) {
    return Math.max(
      1000,
      Math.round(tdee - 300)
    );
  }

  // เพิ่มน้ำหนัก
  if (
    goal === "เพิ่มน้ำหนัก" ||
    goal === "gain_weight"
  ) {
    return Math.round(
      tdee + 300
    );
  }

  // เพิ่มกล้ามเนื้อ
  if (
    goal === "เพิ่มกล้ามเนื้อ" ||
    goal === "gain_muscle"
  ) {
    return Math.round(
      tdee + 200
    );
  }

  // รักษาน้ำหนัก
  return Math.round(tdee);
}

// ======================================================
// Calculate Macros
// ======================================================

function calculateMacros(
  targetKcal: number,
  proteinTarget: number
) {
  const proteinG =
    proteinTarget > 0
      ? Math.round(proteinTarget)
      : Math.round(
          (targetKcal * 0.25) / 4
        );

  // Fat ประมาณ 27% ของพลังงาน
  const fatG = Math.round(
    (targetKcal * 0.27) / 9
  );

  const proteinCalories =
    proteinG * 4;

  const fatCalories =
    fatG * 9;

  const carbCalories =
    Math.max(
      0,
      targetKcal -
        proteinCalories -
        fatCalories
    );

  const carbG = Math.round(
    carbCalories / 4
  );

  return {
    protein_g: proteinG,
    carb_g: carbG,
    fat_g: fatG,
    fiber_g: 25,
    sodium_mg: 2000,
  };
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

    // ถ้า End ก่อน Start
    if (endDate < newStart) {
      setEndDate(newStart);
      return;
    }

    // จำกัดสูงสุด 7 วัน
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
  // Create Meal Plan
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
      // User ID
      // ==================================================

      const userId =
        userProfile.user_id;

      if (!userId) {
        throw new Error(
          "ไม่พบ user_id"
        );
      }

      // ==================================================
      // Health Goals
      // ==================================================

      const healthGoals =
        userProfile.health_goals ||
        {};

      const primaryGoal =
        healthGoals.primary_goal ||
        "maintain_weight";

      console.log(
        "🎯 PRIMARY GOAL:",
        primaryGoal
      );

      // ==================================================
      // TDEE
      // ==================================================

      const tdee = Number(
        healthGoals.tdee_target_kcal
      );

      console.log(
        "🔥 TDEE:",
        tdee
      );

      if (
        !Number.isFinite(tdee) ||
        tdee <= 0
      ) {
        throw new Error(
          "ไม่พบค่า TDEE ของผู้ใช้ กรุณาตั้งค่าเป้าหมายสุขภาพก่อน"
        );
      }

      // ==================================================
      // Target Calories
      // ==================================================

      const targetKcal =
        calculateAdjustedKcal(
          tdee,
          primaryGoal
        );

      console.log(
        "🔥 TARGET KCAL:",
        targetKcal
      );

      // ==================================================
      // Protein
      // ==================================================

      const proteinTarget =
        Number(
          healthGoals.protein_target_g
        );

      const macros =
        calculateMacros(
          targetKcal,
          proteinTarget
        );

      console.log(
        "🥩 MACROS:",
        macros
      );

      // ==================================================
      // Allergies
      // ==================================================

      const allergies =
        flattenObjectValues(
          userProfile.allergies
        );

      console.log(
        "🚫 ALLERGIES:",
        allergies
      );

      // ==================================================
      // Disliked Foods
      // ==================================================

      const dislikedFoods =
        flattenObjectValues(
          userProfile.disliked_foods
        );

      console.log(
        "👎 DISLIKED FOODS:",
        dislikedFoods
      );

      // ==================================================
      // Request Payload
      // ==================================================

      const payload = {
        user_id: userId,

        start_date:
          formatDate(startDate),

        days,

        target_kcal:
          targetKcal,

        protein_g:
          macros.protein_g,

        carb_g:
          macros.carb_g,

        fat_g:
          macros.fat_g,

        fiber_g:
          macros.fiber_g,

        sodium_mg:
          macros.sodium_mg,

        goal:
          primaryGoal,

        allergies,

        disliked_foods:
          dislikedFoods,
      };

      console.log(
        "================================"
      );

      console.log(
        "📤 POST CREATE MEAL PLAN"
      );

      console.log(
        "URL:",
        `${BASE_URL}/api/meal/plans`
      );

      console.log(
        "PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "================================"
      );

      // ==================================================
      // POST Backend
      // ==================================================

      const response =
        await axios.post(
          `${BASE_URL}/api/meal/plans`,
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
        "================================"
      );

      console.log(
        "📥 BACKEND RESPONSE"
      );

      console.log(
        response.data
      );

      console.log(
        "================================"
      );

      // ==================================================
      // Validate Backend Response
      // ==================================================

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Backend สร้างแผนไม่สำเร็จ"
        );
      }

      const planId =
        response.data?.plan_id;

      if (!planId) {
        throw new Error(
          "Backend ไม่ได้ส่ง plan_id กลับมา"
        );
      }

      console.log(
        "================================"
      );

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

      console.log(
        "➡️ GO TO STEP 2"
      );

      console.log(
        "================================"
      );

      // ==================================================
      // Save Current Plan
      // ==================================================

      await AsyncStorage.setItem(
        "currentPlanId",
        String(planId)
      );

      // ==================================================
      // Go Step 2
      // ==================================================

      router.push({
        pathname:
          "/create-plan/step2",

        params: {
          startDate:
            formatDate(startDate),

          endDate:
            formatDate(endDate),

          days: String(days),

          plan_id:
            String(planId),
        },
      });
    } catch (error: any) {
      console.error(
        "================================"
      );

      console.error(
        "❌ CREATE PLAN ERROR"
      );

      console.error(
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
          "❌ RESPONSE:",
          error.response?.data
        );

        console.error(
          "❌ URL:",
          error.config?.url
        );

        console.error(
          "❌ REQUEST DATA:",
          error.config?.data
        );
      }

      console.error(
        "================================"
      );

      let message =
        "ไม่สามารถสร้างแผนอาหารได้";

      if (
        axios.isAxiosError(error)
      ) {
        if (
          error.code ===
          "ECONNABORTED"
        ) {
          message =
            "Backend ใช้เวลาสร้างแผนนานเกินไป กรุณาตรวจสอบ Server";
        } else if (
          error.code ===
          "ERR_NETWORK"
        ) {
          message =
            `ไม่สามารถเชื่อมต่อ Backend ได้\n${BASE_URL}`;
        } else if (
          error.response?.data
            ?.message
        ) {
          message =
            error.response.data.message;
        } else if (
          error.message
        ) {
          message =
            error.message;
        }
      } else if (
        error?.message
      ) {
        message =
          error.message;
      }

      Alert.alert(
        "สร้างแผนไม่สำเร็จ",
        message
      );
    } finally {
      setCreating(false);
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
                กำลังสร้างแผน...
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