import React, {
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

// ======================================================
// API
// ======================================================

const API_URL =
  "http://172.16.8.172:3000";

const USER_ID =
  "U1783945942458";

// ======================================================
// Helpers
// ======================================================

function formatDate(date: Date) {
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

function formatDisplayDate(
  date: Date
) {
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year =
    date.getFullYear();

  return `${day} / ${month} / ${year}`;
}

function getDayDifference(
  start: Date,
  end: Date
) {
  const startDate =
    new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

  const endDate =
    new Date(
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
// Component
// ======================================================

export default function Step1Screen() {
  const [startDate, setStartDate] =
    useState(new Date());

  const [endDate, setEndDate] =
    useState(() => {
      const date =
        new Date();

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
  // Create Plan
  // ====================================================

  const handleNext = async () => {
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

    try {
      setCreating(true);

      const start =
        formatDate(startDate);

      const end =
        formatDate(endDate);

      console.log(
        "================================"
      );

      console.log(
        "📤 CREATE MEAL PLAN"
      );

      console.log(
        "API:",
        `${API_URL}/api/meal/plans`
      );

      console.log({
        user_id: USER_ID,
        start_date: start,
        days,
      });

      console.log(
        "================================"
      );

      const response =
        await axios.post(
          `${API_URL}/api/meal/plans`,
          {
            user_id:
              USER_ID,

            start_date:
              start,

            days,

            target_kcal:
              1850,

            protein_g:
              106,

            carb_g:
              250,

            fat_g:
              60,

            fiber_g:
              25,

            sodium_mg:
              2000,

            goal:
              "gain_weight",

            allergies: [],

            disliked_foods: [],
          },
          {
            timeout: 60000,
          }
        );

      console.log(
        "📥 BACKEND RESPONSE:",
        response.data
      );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "สร้างแผนอาหารไม่สำเร็จ"
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
        "✅ PLAN CREATED:",
        planId
      );

      // ==================================================
      // Go Step 2
      // ==================================================

      router.push({
        pathname:
          "/create-plan/step2",

        params: {
          startDate:
            start,

          endDate:
            end,

          days:
            String(days),

          plan_id:
            planId,
        },
      });
    } catch (error: any) {
      console.error(
        "❌ CREATE PLAN ERROR:",
        error
      );

      let message =
        "ไม่สามารถสร้างแผนอาหารได้";

      if (
        axios.isAxiosError(error)
      ) {
        console.error(
          "STATUS:",
          error.response?.status
        );

        console.error(
          "DATA:",
          error.response?.data
        );

        console.error(
          "URL:",
          error.config?.url
        );

        if (
          error.code ===
          "ECONNABORTED"
        ) {
          message =
            "การสร้างแผนใช้เวลานานเกินไป กรุณาตรวจสอบ Backend";
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

        {/* Start */}

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

        {/* End */}

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