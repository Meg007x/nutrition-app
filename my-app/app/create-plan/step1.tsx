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
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import axios, { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BASE_URL } from "../../constants/config";
import { Brand } from "../../constants/theme";

const PLAN_ACTION_COLOR = "#F9A800";

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

function parseInputDate(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
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

      const raw =
        await AsyncStorage.getItem(
          "currentUser"
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

      if (!userId) {
        throw new Error(
          "ไม่พบ user_id ในข้อมูลผู้ใช้"
        );
      }

      // ==================================================
      // Fetch Backend Profile
      // ==================================================

      try {
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

          return;
        }
      } catch (profileError) {
        if (isAxiosError(profileError)) {
          console.warn(
            "Unable to load user profile from backend; using cached profile.",
            profileError.response?.status
          );
        } else {
          console.warn(
            "Unable to load user profile from backend; using cached profile."
          );
        }
      }

      // ==================================================
      // Fallback AsyncStorage
      // ==================================================

      setUserProfile({
        ...storedUser,
        user_id: userId,
      });
    } catch (error) {
      console.error("Unable to load user profile.", error);

      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลผู้ใช้ได้"
      );
    } finally {
      setLoadingUser(false);

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

  const updateStartDate = (selected?: Date) => {
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

  const handleStartDateChange = (
    _event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS !== "ios") {
      setShowStartPicker(false);
    }

    updateStartDate(selected);
  };

  // ====================================================
  // End Date
  // ====================================================

  const updateEndDate = (selected?: Date) => {
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

  const handleEndDateChange = (
    _event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS !== "ios") {
      setShowEndPicker(false);
    }

    updateEndDate(selected);
  };

  // ====================================================
  // Create Meal Plan
  // ====================================================

  const handleNext = async () => {
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

      // ==================================================
      // Allergies
      // ==================================================

      const allergies =
        flattenObjectValues(
          userProfile.allergies
        );

      // ==================================================
      // Disliked Foods
      // ==================================================

      const dislikedFoods =
        flattenObjectValues(
          userProfile.disliked_foods
        );

      // ==================================================
      // Request Payload
      // ==================================================

      const payload = {
        user_id: userId,

        start_date:
          formatDate(startDate),

        days,

        goal:
          primaryGoal,

        allergies,

        disliked_foods:
          dislikedFoods,
      };

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
        "Meal plan creation failed.",
        isAxiosError(error) ? error.response?.status : undefined
      );

      let message =
        "ไม่สามารถสร้างแผนอาหารได้";

      if (
        isAxiosError(error)
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
          barStyle="light-content"
          backgroundColor={PLAN_ACTION_COLOR}
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={Brand.primary}
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
        barStyle="light-content"
        backgroundColor={PLAN_ACTION_COLOR}
      />

      {/* Header */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          style={
            styles.headerButton
          }
          onPress={() => {
            // 🔧 FIX: ไม่ใช้ router.back() เพราะอาจไม่มี screen ใน stack
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/plan");
            }
          }}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#fff"
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

        {Platform.OS === "web" ? (
          React.createElement("input", {
            type: "date",
            value: formatDate(startDate),
            "aria-label": "วันที่เริ่มต้น",
            onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
              updateStartDate(parseInputDate(event.currentTarget.value)),
            style: {
              boxSizing: "border-box",
              width: "100%",
              height: 54,
              border: "1px solid #222",
              borderRadius: 10,
              padding: "0 16px",
              backgroundColor: "#fff",
              color: "#222",
              fontFamily: "inherit",
              fontSize: 16,
            },
          })
        ) : (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateText}>
              {formatDisplayDate(startDate)}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#EF4444"
            />
          </TouchableOpacity>
        )}

        {showStartPicker && Platform.OS !== "web" && (
          <>
            <DateTimePicker
              value={startDate}
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={handleStartDateChange}
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowStartPicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>เสร็จสิ้น</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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

        {Platform.OS === "web" ? (
          React.createElement("input", {
            type: "date",
            value: formatDate(endDate),
            min: formatDate(startDate),
            max: formatDate(
              new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate() + 6
              )
            ),
            "aria-label": "วันที่สิ้นสุด",
            onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
              updateEndDate(parseInputDate(event.currentTarget.value)),
            style: {
              boxSizing: "border-box",
              width: "100%",
              height: 54,
              border: "1px solid #222",
              borderRadius: 10,
              padding: "0 16px",
              backgroundColor: "#fff",
              color: "#222",
              fontFamily: "inherit",
              fontSize: 16,
            },
          })
        ) : (
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateText}>
              {formatDisplayDate(endDate)}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#EF4444"
            />
          </TouchableOpacity>
        )}

        {showEndPicker && Platform.OS !== "web" && (
          <>
            <DateTimePicker
              value={endDate}
              mode="date"
              minimumDate={startDate}
              maximumDate={
                new Date(
                  startDate.getFullYear(),
                  startDate.getMonth(),
                  startDate.getDate() + 6
                )
              }
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={handleEndDateChange}
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowEndPicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>เสร็จสิ้น</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
      fontFamily: "NotoSansThai",
    },

    header: {
      height: 60,
      backgroundColor: PLAN_ACTION_COLOR,
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
      color: "#fff",
      fontFamily: "NotoSansThaiBold",
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 28,
    },

    title: {
      fontSize: 27,
      fontWeight: "bold",
      fontFamily: "NotoSansThaiBold",
    },

    subtitle: {
      marginTop: 8,
      marginBottom: 30,
      fontSize: 15,
      color: "#737373",
      fontFamily: "NotoSansThai",
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      fontFamily: "NotoSansThaiBold",
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
      fontFamily: "NotoSansThai",
    },

    datePickerActions: {
      alignItems: "flex-end",
      marginTop: 4,
    },

    datePickerDoneButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    datePickerDoneText: {
      color: Brand.primary,
      fontSize: 15,
      fontFamily: "NotoSansThaiBold",
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
      fontFamily: "NotoSansThaiBold",
    },

    daysHint: {
      marginTop: 4,
      fontSize: 13,
      color: "#777",
      fontFamily: "NotoSansThai",
    },

    daysNumber: {
      fontSize: 22,
      fontWeight: "bold",
      color: Brand.primary,
      fontFamily: "NotoSansThaiBold",
    },

    errorText: {
      marginTop: 12,
      color: "#EF4444",
      fontSize: 14,
      fontFamily: "NotoSansThai",
    },

    footer: {
      paddingHorizontal: 20,
      paddingBottom: 25,
    },

    nextButton: {
      height: 56,
      borderRadius: 12,
      backgroundColor: PLAN_ACTION_COLOR,
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
      fontFamily: "NotoSansThaiBold",
    },

    loadingText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
      fontFamily: "NotoSansThai",
    },
  });
