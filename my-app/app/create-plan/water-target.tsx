import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BASE_URL } from "../../constants/config";
import { Brand } from "../../constants/theme";
import { getWaterTargetRange } from "../../utils/waterTargets";
import {
  requestWaterReminderPermission,
  syncWaterReminderSchedule,
} from "../../utils/notificationService";

const WATER_STEP_ML = 100;
const WATER_REMINDER_PREFERENCE_KEY = (id: string) =>
  `water_reminders_enabled_${id}`;

const getWaterTargetStepCount = (minimum: number, maximum: number) =>
  Math.ceil((maximum - minimum) / WATER_STEP_ML);

const getWaterTargetAtStep = (
  stepIndex: number,
  minimum: number,
  maximum: number
) => {
  const finalStep = getWaterTargetStepCount(minimum, maximum);
  const boundedStep = Math.min(finalStep, Math.max(0, stepIndex));
  return boundedStep === finalStep
    ? maximum
    : minimum + boundedStep * WATER_STEP_ML;
};

const getWaterTargetFromProgress = (
  progress: number,
  minimum: number,
  maximum: number
) => {
  const range = maximum - minimum;
  const rawTarget = minimum + progress * range;
  const lastRegularStep = Math.floor(range / WATER_STEP_ML);
  const lastRegularTarget = minimum + lastRegularStep * WATER_STEP_ML;
  const regularTarget = Math.min(
    lastRegularTarget,
    minimum +
      Math.round((rawTarget - minimum) / WATER_STEP_ML) * WATER_STEP_ML
  );

  if (
    lastRegularTarget < maximum &&
    rawTarget >= (lastRegularTarget + maximum) / 2
  ) {
    return maximum;
  }

  return regularTarget;
};

type StoredUser = {
  user_id?: string;
  weight_kg?: number;
  water_target_ml?: number;
  [key: string]: unknown;
};

const getRecommendedWater = (weight: number) => {
  return getWaterTargetRange(weight).minimum;
};

export default function WaterTargetScreen() {
  const [userId, setUserId] = useState("");
  const [weight, setWeight] = useState(0);
  const [waterTarget, setWaterTarget] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [reminderPreferenceLoaded, setReminderPreferenceLoaded] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const sliderWidth = useRef(0);

  const recommendedWater = useMemo(() => getRecommendedWater(weight), [weight]);
  const { minimum: minWater, maximum: maxWater, isCapped } = useMemo(
    () => getWaterTargetRange(weight),
    [weight]
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("currentUser");
        if (!raw) throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

        const user = JSON.parse(raw) as StoredUser;
        if (!user.user_id) throw new Error("ไม่พบรหัสผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

        const userWeight = Number(user.weight_kg || 0);
        const recommendation = getRecommendedWater(userWeight);
        setUserId(user.user_id);
        setWeight(userWeight);
        setWaterTarget(recommendation);
        setNotificationEnabled(
          (await AsyncStorage.getItem(
            WATER_REMINDER_PREFERENCE_KEY(user.user_id)
          )) === "true"
        );
      } catch (error: any) {
        setErrorMessage(error.message || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
        setReminderPreferenceLoaded(true);
      }
    };

    loadUser();
  }, []);

  const updateWaterTargetFromSlider = (locationX: number) => {
    if (sliderWidth.current <= 0) return;
    const progress = Math.min(1, Math.max(0, locationX / sliderWidth.current));
    setWaterTarget(getWaterTargetFromProgress(progress, minWater, maxWater));
  };

  const toggleWaterReminders = async (enabled: boolean) => {
    setNotificationError("");
    if (!enabled) {
      setNotificationEnabled(false);
      return;
    }

    try {
      const granted = await requestWaterReminderPermission();
      if (!granted) {
        const message =
          Platform.OS === "web" && typeof window !== "undefined" && !("Notification" in window)
            ? "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน"
            : "กรุณาอนุญาตการแจ้งเตือนจากการตั้งค่าอุปกรณ์หรือเบราว์เซอร์";
        setNotificationError(message);
        return;
      }
      setNotificationEnabled(true);
    } catch (error) {
      console.error("Request water reminder permission error:", error);
      setNotificationError("ขออนุญาตแจ้งเตือนไม่สำเร็จ โปรดลองอีกครั้ง");
    }
  };

  const saveWaterTargetAndContinue = async () => {
    if (!userId || saving) return;

    try {
      setSaving(true);
      setErrorMessage("");
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
        WATER_REMINDER_PREFERENCE_KEY(userId),
        String(notificationEnabled)
      );
      const reminderResult = await syncWaterReminderSchedule({
        userId,
        enabled: notificationEnabled,
        totalMl: 0,
        targetMl: waterTarget,
      });
      if (!reminderResult.ok) {
        throw new Error("ไม่สามารถตั้งเวลาการแจ้งเตือนดื่มน้ำได้");
      }

      const raw = await AsyncStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw) as StoredUser;
        await AsyncStorage.setItem(
          "currentUser",
          JSON.stringify({ ...user, water_target_ml: waterTarget })
        );
      }

      router.replace("/create-plan/step1");
    } catch (error: any) {
      const message = error.message || "ไม่สามารถบันทึกเป้าหมายน้ำได้";
      setErrorMessage(message);
      if (Platform.OS === "web") {
        window.alert(`บันทึกไม่สำเร็จ\n${message}`);
      } else {
        Alert.alert("บันทึกไม่สำเร็จ", message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <Ionicons name="water" size={44} color="#168FE5" />
        </View>
        <Text style={styles.title}>ตั้งเป้าหมายการดื่มน้ำ</Text>
        <Text style={styles.subtitle}>
          เลือกปริมาณน้ำที่เหมาะกับคุณ ก่อนเริ่มสร้างแผนการกิน
        </Text>

        <View style={styles.card}>
          {isCapped && (
            <Text style={styles.safetyWarning}>
              ระบบจำกัดเป้าหมายไว้ไม่เกิน 4,000 ml ซึ่งเป็นขีดจำกัดของแอป
              ไม่ใช่ปริมาณที่เหมาะกับทุกคน การดื่มน้ำมากเกินไปในเวลาสั้นอาจเป็นอันตรายได้
              หากเป็นนักกีฬาหรือออกกำลังกายหนักเป็นพิเศษ ควรปรึกษาแพทย์
              เพื่อปรับปริมาณน้ำดื่มที่เหมาะสม
            </Text>
          )}
          <Text style={styles.targetLabel}>เป้าหมายของคุณต่อวัน</Text>
          <Text style={styles.targetValue}>
            {waterTarget.toLocaleString()}
            <Text style={styles.targetUnit}> มล.</Text>
          </Text>
          <Text style={styles.rangeText}>
            เลือกได้ตั้งแต่ {minWater.toLocaleString()}–{maxWater.toLocaleString()} มล. ต่อวัน
          </Text>

          <View style={styles.recommendBadgeWrap}>
            <View style={styles.recommendBadge}>
              <Text style={styles.recommendBadgeText}>แนะนำ</Text>
            </View>
          </View>
          <View
            style={styles.sliderTouchArea}
            onLayout={(event) => {
              sliderWidth.current = event.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => !saving}
            onMoveShouldSetResponder={() => !saving}
            onResponderGrant={(event) =>
              updateWaterTargetFromSlider(event.nativeEvent.locationX)
            }
            onResponderMove={(event) =>
              updateWaterTargetFromSlider(event.nativeEvent.locationX)
            }
            accessibilityRole="adjustable"
            accessibilityLabel="เป้าหมายการดื่มน้ำต่อวัน"
            accessibilityValue={{
              min: minWater,
              max: maxWater,
              now: waterTarget,
            }}
            accessibilityActions={[
              { name: "decrement", label: "ลดเป้าหมาย 100 มิลลิลิตร" },
              { name: "increment", label: "เพิ่มเป้าหมาย 100 มิลลิลิตร" },
            ]}
            onAccessibilityAction={(event) => {
              const stepDelta =
                event.nativeEvent.actionName === "increment" ? 1 : -1;
              const stepIndex =
                waterTarget >= maxWater
                  ? getWaterTargetStepCount(minWater, maxWater)
                  : Math.round((waterTarget - minWater) / WATER_STEP_ML);
              setWaterTarget(
                getWaterTargetAtStep(stepIndex + stepDelta, minWater, maxWater)
              );
            }}
          >
            <View style={styles.sliderTrack} />
            <View
              style={[
                styles.sliderTrackActive,
                {
                  width: `${
                    maxWater === minWater
                      ? 0
                      : ((waterTarget - minWater) / (maxWater - minWater)) * 100
                  }%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${
                    maxWater === minWater
                      ? 0
                      : ((waterTarget - minWater) / (maxWater - minWater)) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>
              {minWater.toLocaleString()} ml
            </Text>
            <Text style={styles.sliderStepLabel}>ปรับทีละ 100 ml</Text>
            <Text style={styles.sliderLabel}>
              {maxWater.toLocaleString()} ml
            </Text>
          </View>

          <TouchableOpacity
            style={styles.useRecommendedButton}
            onPress={() => setWaterTarget(recommendedWater)}
            activeOpacity={0.8}
          >
            <Text style={styles.useRecommendedText}>ใช้ค่าที่แนะนำ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notificationCard}>
          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationTitle}>เตือนให้ดื่มน้ำ</Text>
            <Text style={styles.notificationSubtitle}>
              แจ้งทุก 1 ชั่วโมง (08:00–20:00 น.)
            </Text>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={toggleWaterReminders}
            disabled={!reminderPreferenceLoaded || saving}
            accessibilityLabel="เปิดการแจ้งเตือนดื่มน้ำทุกชั่วโมง"
          />
        </View>
        {notificationError ? (
          <Text style={styles.notificationError}>
            {notificationError}
          </Text>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.continueButton, saving && styles.disabledButton]}
          onPress={saveWaterTargetAndContinue}
          disabled={saving || !userId}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueText}>บันทึกและเริ่มสร้างแผนการกิน</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAFC" },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
  },
  content: { flexGrow: 1, padding: 24, paddingBottom: 36 },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: "#E7F4FF",
  },
  title: {
    marginTop: 18,
    color: "#202733",
    fontSize: 25,
    textAlign: "center",
    fontFamily: "NotoSansThaiBold",
  },
  subtitle: {
    marginTop: 8,
    color: "#667085",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  card: {
    marginTop: 28,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  safetyWarning: {
    marginTop: 10,
    color: "#A15C00",
    backgroundColor: "#FFF6E5",
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  useRecommendedButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#EAF5FF",
  },
  useRecommendedText: { color: "#1678C2", fontSize: 14, fontFamily: "NotoSansThaiBold" },
  targetLabel: {
    marginTop: 20,
    color: "#667085",
    fontSize: 15,
    fontFamily: "NotoSansThaiBold",
  },
  targetValue: {
    marginTop: 8,
    color: "#202733",
    fontSize: 40,
    fontFamily: "NotoSansThaiBold",
  },
  targetUnit: { color: "#667085", fontSize: 18, fontFamily: "NotoSansThai" },
  rangeText: { marginTop: 4, color: "#667085", fontSize: 13, fontFamily: "NotoSansThai" },
  sliderTouchArea: {
    width: "100%",
    height: 32,
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 0,
    touchAction: "none",
  },
  sliderTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DCE5F3",
  },
  sliderTrackActive: {
    position: "absolute",
    left: 0,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#168FE5",
  },
  sliderThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    marginLeft: -12,
    borderWidth: 3,
    borderRadius: 12,
    borderColor: "#FFFFFF",
    backgroundColor: "#168FE5",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  sliderLabels: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  recommendBadgeWrap: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 6,
  },
  recommendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#EAF5FF",
  },
  recommendBadgeText: {
    color: "#1678C2",
    fontSize: 11,
    fontFamily: "NotoSansThaiBold",
  },
  sliderLabel: {
    color: "#667085",
    fontSize: 12,
    fontFamily: "NotoSansThai",
  },
  sliderStepLabel: {
    color: "#8A94A3",
    fontSize: 12,
    fontFamily: "NotoSansThai",
  },
  notificationCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationTextWrap: {
    flex: 1,
  },
  notificationTitle: {
    color: "#202733",
    fontSize: 15,
    fontFamily: "NotoSansThaiBold",
  },
  notificationSubtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "NotoSansThai",
  },
  notificationError: {
    marginTop: 8,
    color: "#D32F2F",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  disabledButton: { opacity: 0.45 },
  errorText: {
    marginTop: 14,
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  continueButton: {
    minHeight: 54,
    marginTop: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5A400",
  },
  continueText: { color: "#FFFFFF", fontSize: 16, fontFamily: "NotoSansThaiBold" },
});
