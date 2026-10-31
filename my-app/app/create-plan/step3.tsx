import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/config";
import { Brand } from "../../constants/theme";
import { getWaterTargetRange } from "../../utils/waterTargets";

// ======================================================
// Component
// ======================================================

export default function Step3Screen() {
  // ====================================================
  // Params from Step 2
  // ====================================================

  const params =
    useLocalSearchParams<{
      plan_id?: string;
      startDate?: string;
      endDate?: string;
      days?: string;
    }>();

  const planId =
    typeof params.plan_id ===
    "string"
      ? params.plan_id
      : "";

  // ====================================================
  // Debug Log
  // ====================================================

  console.log(
    "================================"
  );

  console.log(
    "💧 STEP 3 OPENED"
  );

  console.log(
    "📋 PLAN ID:",
    planId
  );

  console.log(
    "📅 START DATE:",
    params.startDate
  );

  console.log(
    "📅 END DATE:",
    params.endDate
  );

  console.log(
    "📅 DAYS:",
    params.days
  );

  console.log(
    "================================"
  );

  // เป้าหมายน้ำเริ่มต้น
  const [waterTarget, setWaterTarget] =
    useState(2000);
  const [waterRange, setWaterRange] = useState(() => getWaterTargetRange(0));

  useEffect(() => {
    const loadSavedWaterTarget = async () => {
      const raw = await AsyncStorage.getItem("currentUser");
      if (!raw) return;

      const user = JSON.parse(raw);
      const range = getWaterTargetRange(Number(user?.weight_kg || 0));
      const savedTarget = Number(user?.water_target_ml || range.minimum);
      setWaterRange(range);
      setWaterTarget(Math.min(range.maximum, Math.max(range.minimum, savedTarget)));
    };

    loadSavedWaterTarget().catch((error) => {
      console.error("Load water target error:", error);
    });
  }, []);

  // เปิด / ปิด การแจ้งเตือน
  const [notificationEnabled, setNotificationEnabled] =
    useState(true);

  // ====================================================
  // Water Range
  // ====================================================

  const MIN_WATER = waterRange.minimum;
  const MAX_WATER = waterRange.maximum;
  const STEP = 100;

  // ====================================================
  // Increase / Decrease
  // ====================================================

  const decreaseWater = () => {
    setWaterTarget((current) =>
      Math.max(
        MIN_WATER,
        current - STEP
      )
    );
  };

  const increaseWater = () => {
    setWaterTarget((current) =>
      Math.min(
        MAX_WATER,
        current + STEP
      )
    );
  };

  // ====================================================
  // Slider Position
  // ====================================================

  const sliderPercent = useMemo(() => {
    return (
      (MAX_WATER === MIN_WATER
        ? 0
        : (waterTarget - MIN_WATER) /
          (MAX_WATER - MIN_WATER)) *
      100
    );
  }, [waterTarget, MIN_WATER, MAX_WATER]);

  // ====================================================
  // Start Using
  // ====================================================

  const [saving, setSaving] = useState(false);

  const handleStartUsing = async () => {
    console.log("💧 STEP 3 | WATER:", waterTarget);

    try {
      setSaving(true);
      const raw = await AsyncStorage.getItem("currentUser");
      const user = raw ? JSON.parse(raw) : null;
      const userId = user?.user_id;
      if (!userId) throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

      const response = await fetch(`${BASE_URL}/api/users/water-target`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, water_target_ml: waterTarget }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "ไม่สามารถบันทึกเป้าหมายน้ำได้");
      }
      await AsyncStorage.setItem(
        "currentUser",
        JSON.stringify({ ...user, water_target_ml: waterTarget })
      );
      router.replace("/(tabs)/plan");
    } catch (e: any) {
      const message = e?.message || "ไม่สามารถบันทึกเป้าหมายน้ำได้";
      if (Platform.OS === "web") window.alert(message);
      else Alert.alert("บันทึกไม่สำเร็จ", message);
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Brand.primary}
      />

      {/* ============================================= */}
      {/* Header */}
      {/* ============================================= */}

      <View style={styles.header} />

      {/* ============================================= */}
      {/* Content */}
      {/* ============================================= */}

      <View style={styles.content}>

        {/* Success Icon */}

        <View style={styles.successCircle}>
          <Ionicons
            name="checkmark"
            size={130}
            color="#00F230"
          />
        </View>

        {/* Title */}

        <Text style={styles.title}>
          แผนของคุณพร้อมแล้ว !
        </Text>

        <Text style={styles.subtitle}>
          เหลืออีกขั้นตอนเดียวมาตั้งเป้าการดื่มน้ำเพื่อ
        </Text>

        <Text style={styles.subtitle}>
          แผนการที่สมบูรณ์กัน
        </Text>

        {/* ========================================= */}
        {/* Water Target */}
        {/* ========================================= */}

        <View style={styles.waterSection}>

          <View style={styles.waterHeader}>

            <View style={styles.waterTitleRow}>

              <Ionicons
                name="water"
                size={40}
                color="#20D8F2"
              />

              <Text style={styles.waterTitle}>
                เป้าหมายดื่มน้ำ
              </Text>

              <View style={styles.lightBulb}>
                <Text style={styles.lightBulbText}>
                  💡
                </Text>
              </View>

            </View>

            <Text style={styles.waterValue}>
              {waterTarget.toLocaleString()} ml
            </Text>

          </View>

          {/* ======================================= */}
          {/* Water Slider */}
          {/* ======================================= */}

          <View style={styles.sliderContainer}>

            <View style={styles.sliderTrack} />

            <View
              style={[
                styles.sliderProgress,
                {
                  width: `${sliderPercent}%`,
                },
              ]}
            />

            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${sliderPercent}%`,
                },
              ]}
            />

          </View>

          {/* ======================================= */}
          {/* Water Labels */}
          {/* ======================================= */}

          <View style={styles.sliderLabels}>

            <Text style={styles.sliderLabel}>
              ขั้นต่ำ ({(MIN_WATER / 1000).toLocaleString()} L)
            </Text>

            <Text style={styles.sliderLabel}>
              ปรับได้ทีละ 100 ml
            </Text>

            <Text style={styles.sliderLabel}>
              สูงสุด ({(MAX_WATER / 1000).toLocaleString()} L)
            </Text>

          </View>

          {/* ======================================= */}
          {/* Temporary Controls */}
          {/* ======================================= */}

          <View style={styles.adjustContainer}>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={decreaseWater}
              disabled={
                waterTarget <= MIN_WATER
              }
            >
              <Text style={styles.adjustText}>
                −
              </Text>
            </TouchableOpacity>

            <Text style={styles.adjustValue}>
              {waterTarget.toLocaleString()} ml
            </Text>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={increaseWater}
              disabled={
                waterTarget >= MAX_WATER
              }
            >
              <Text style={styles.adjustText}>
                +
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        {waterRange.isCapped && (
          <Text style={styles.waterSafetyWarning}>
            ระบบจำกัดเป้าหมายไว้ไม่เกิน 4,000 ml ซึ่งเป็นขีดจำกัดของแอป
            ไม่ใช่ปริมาณที่เหมาะกับทุกคน การดื่มน้ำมากเกินไปในเวลาสั้นอาจเป็นอันตรายได้
            หากเป็นนักกีฬาหรือออกกำลังกายหนักเป็นพิเศษ ควรปรึกษาแพทย์
            เพื่อปรับปริมาณน้ำดื่มที่เหมาะสม
          </Text>
        )}

        {/* ========================================= */}
        {/* Notification */}
        {/* ========================================= */}

        <View style={styles.notificationCard}>

          <View style={styles.notificationLeft}>

            <View style={styles.bellCircle}>
              <Ionicons
                name="notifications-outline"
                size={25}
                color="#000"
              />
            </View>

            <View>
              <Text style={styles.notificationTitle}>
                เตือนให้ดื่มน้ำ
              </Text>

              <Text style={styles.notificationSubtitle}>
                ทุกๆ 1 ชั่วโมง (08:00 - 18:00)
              </Text>
            </View>

          </View>

          <Switch
            value={notificationEnabled}
            onValueChange={
              setNotificationEnabled
            }
            trackColor={{
              false: "#D1D5DB",
              true: "#00F230",
            }}
            thumbColor="#fff"
          />

        </View>

      </View>

      {/* ============================================= */}
      {/* Footer */}
      {/* ============================================= */}

      <View style={styles.footer}>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartUsing}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.startButtonText}>
            {saving ? "กำลังบันทึก..." : "เริ่มต้นใช้งาน"}
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ====================================================
  // Header
  // ====================================================

  header: {
    height: 0,
    backgroundColor: Brand.primary,
  },

  // ====================================================
  // Content
  // ====================================================

  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
  },

  // ====================================================
  // Success
  // ====================================================

  successCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 10,
    borderColor: "#000",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },

  title: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 25,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#777",
    lineHeight: 21,
  },

  // ====================================================
  // Water
  // ====================================================

  waterSection: {
    marginTop: 38,
  },

  waterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
  },

  waterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  waterTitle: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  lightBulb: {
    marginLeft: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFF2CC",
    justifyContent: "center",
    alignItems: "center",
  },

  lightBulbText: {
    fontSize: 15,
  },

  waterValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  waterSafetyWarning: {
    marginTop: 10,
    marginHorizontal: 12,
    color: "#A15C00",
    backgroundColor: "#FFF6E5",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  // ====================================================
  // Slider
  // ====================================================

  sliderContainer: {
    height: 25,
    marginTop: 15,
    marginHorizontal: 5,
    justifyContent: "center",
  },

  sliderTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#666",
  },

  sliderProgress: {
    position: "absolute",
    left: 0,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#087CFF",
  },

  sliderThumb: {
    position: "absolute",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#087CFF",
  },

  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
  },

  sliderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
  },

  // ====================================================
  // Adjust
  // ====================================================

  adjustContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 18,
  },

  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  adjustText: {
    fontSize: 23,
    fontWeight: "600",
  },

  adjustValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  // ====================================================
  // Notification
  // ====================================================

  notificationCard: {
    marginTop: 28,
    marginHorizontal: 0,
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,

    borderBottomWidth: 4,
    borderBottomColor: "#FFC44D",
  },

  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  bellCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFE7A8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  notificationSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#777",
  },

  // ====================================================
  // Footer
  // ====================================================

  footer: {
    paddingHorizontal: 10,
    paddingBottom: 24,
    paddingTop: 10,
  },

  startButton: {
    height: 68,
    borderRadius: 9,
    backgroundColor: "#FFB000",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "800",
  },
});
