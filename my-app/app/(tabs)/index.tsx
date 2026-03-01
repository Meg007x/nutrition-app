import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../constants/config";

type BackendDashboardDTO = {
  user: { name?: string; goal_status?: string };
  calories: { target: number; consumed: number; remaining: number; percent: number };
  macros: {
    protein: { current: number; target: number };
    carb: { current: number; target: number };
    fat: { current: number; target: number };
  };
  water: { current: number; target: number };
  next_meal: any | null;

  warnings?: { kcalOver?: boolean; carbNearLimit?: boolean; waterLow?: boolean };
  recommendation?: { title: string; message: string } | null;
  streakDays?: number;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const fmtTHDate = () => new Date().toLocaleDateString("th-TH");

export default function HomeScreen() {
  const [data, setData] = useState<BackendDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ streak modal
  const [showStreakModal, setShowStreakModal] = useState(false);

  const userId = "sunny";

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/dashboard/${encodeURIComponent(userId)}`);
        const json = (await res.json()) as BackendDashboardDTO;
        if (alive) setData(json);
      } catch (e) {
        console.log("โหลด dashboard ไม่ได้:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const kcalPct = useMemo(() => {
    if (!data) return 0;
    return Number.isFinite(data.calories?.percent) ? data.calories.percent : 0;
  }, [data]);

  const isOver = (data?.calories?.consumed ?? 0) > (data?.calories?.target ?? 0);

  const carbNearLimit = useMemo(() => {
    if (!data) return false;
    const cur = data.macros?.carb?.current ?? 0;
    const tar = data.macros?.carb?.target ?? 1;
    return cur >= tar * 0.9;
  }, [data]);

  const waterLow = useMemo(() => {
    if (!data) return false;
    const cur = data.water?.current ?? 0;
    const tar = data.water?.target ?? 1;
    return cur < tar * 0.4;
  }, [data]);

  const warnings = useMemo(() => {
    return {
      kcalOver: data?.warnings?.kcalOver ?? isOver,
      carbNearLimit: data?.warnings?.carbNearLimit ?? (!isOver && carbNearLimit),
      waterLow: data?.warnings?.waterLow ?? waterLow,
    };
  }, [data, isOver, carbNearLimit, waterLow]);

  const recommendation = useMemo(() => {
    if (data?.recommendation) return data.recommendation;
    if (warnings.carbNearLimit) {
      return {
        title: "คำแนะนำมื้อเย็น",
        message: "คาร์บของคุณใกล้เต็มแล้ว มื้อเย็นแนะนำให้เลี่ยงข้าว/เส้น และเน้นโปรตีน/ผัก",
      };
    }
    return null;
  }, [data, warnings.carbNearLimit]);

  const notificationCount = useMemo(() => {
    return [warnings.kcalOver, warnings.carbNearLimit, warnings.waterLow].filter(Boolean).length;
  }, [warnings]);

  const nextMeal = useMemo(() => {
    const m = data?.next_meal;
    if (!m) return null;
    return {
      time: m.time || m.meal_time || "18:00",
      name: m.name || m.title || m.food_name || "-",
      kcal: m.kcal || m.calories || 0,
      tag: m.tag || m.note || undefined,
    };
  }, [data]);

  const proteinRatio = useMemo(() => {
    if (!data) return 0;
    return clamp01((data.macros?.protein?.current ?? 0) / Math.max(1, data.macros?.protein?.target ?? 1));
  }, [data]);

  const carbRatio = useMemo(() => {
    if (!data) return 0;
    return clamp01((data.macros?.carb?.current ?? 0) / Math.max(1, data.macros?.carb?.target ?? 1));
  }, [data]);

  const fatRatio = useMemo(() => {
    if (!data) return 0;
    return clamp01((data.macros?.fat?.current ?? 0) / Math.max(1, data.macros?.fat?.target ?? 1));
  }, [data]);

  const streakDays = data?.streakDays ?? 1;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ✅ Streak Modal */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStreakModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalIcon}>🔥</Text>
            <Text style={styles.modalDay}>{streakDays} วัน</Text>
            <Text style={styles.modalGreat}>สุดยอดมาก</Text>
            <Text style={styles.modalDesc}>
              คุณทำตามเป้าหมายแคลอรี่ต่อเนื่องมาแล้ว {streakDays} วัน{"\n"}
              พยายามรักษาวินัยต่อไปเพื่อสุขภาพที่ดี!
            </Text>

            <Pressable style={styles.modalButton} onPress={() => setShowStreakModal(false)}>
              <Text style={styles.modalButtonText}>ไปลุยต่อ!</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>ยินดีต้อนรับ</Text>
            <Text style={styles.name}>คุณ {data?.user?.name ?? "-"}</Text>
            <Text style={styles.date}>{fmtTHDate()}</Text>

            <Pressable
              style={styles.weekLinkWrap}
              onPress={() => router.push({ pathname: "/weekly", params: { userId } })}
            >
              <Text style={styles.weekLink}>ดูภาพรวมรายสัปดาห์ ›</Text>
            </Pressable>
          </View>

          {/* RIGHT */}
          <View style={styles.rightHeader}>
            {/* 🔔 Notification */}
            <Pressable style={styles.bellWrap} onPress={() => router.push("/notifications")}>
              <Ionicons
                name={notificationCount > 0 ? "notifications" : "notifications-outline"}
                size={26}
                color={notificationCount > 0 ? "#d00" : "#333"}
              />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* 🔥 Streak (กดได้ -> เปิด modal) */}
            <Pressable style={styles.streakPill} onPress={() => setShowStreakModal(true)}>
              <Text style={styles.streakText}>🔥 ต่อเนื่อง {streakDays} วัน (?)</Text>
            </Pressable>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ภาพรวมวันนี้</Text>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>กินไปแล้ว (Kcal)</Text>
              <Text style={[styles.bigNumber, warnings.kcalOver && { color: "#d00" }]}>
                {data?.calories?.consumed ?? 0}
              </Text>
              <Text style={styles.sub}>เป้าหมาย: {data?.calories?.target ?? 0} Kcal</Text>
            </View>

            <View style={[styles.circle, warnings.kcalOver ? styles.circleRed : styles.circleGreen]}>
              <Text style={styles.circleText}>{kcalPct}%</Text>
            </View>
          </View>

          {/* Macro */}
          <View style={styles.macroRow}>
            <View style={[styles.macroItem, styles.macroItemBorder]}>
              <Text style={styles.macroLabel}>โปรตีน</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.protein?.current ?? 0}/{data?.macros?.protein?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(proteinRatio * 100)}%` }, styles.fillProtein]} />
              </View>
            </View>

            <View style={[styles.macroItem, styles.macroItemBorder]}>
              <Text style={styles.macroLabel}>คาร์บ</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.carb?.current ?? 0}/{data?.macros?.carb?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(carbRatio * 100)}%` }, styles.fillCarb]} />
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>ไขมัน</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.fat?.current ?? 0}/{data?.macros?.fat?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(fatRatio * 100)}%` }, styles.fillFat]} />
              </View>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {warnings.kcalOver && (
          <View style={styles.alertRed}>
            <Text style={styles.alertTitle}>แคลอรี่ของคุณเกินแล้ว!!!</Text>
            <Text style={styles.alertBody}>คุณทานเกินเป้าหมายแล้ว</Text>
          </View>
        )}

        {!warnings.kcalOver && recommendation && (
          <View style={styles.reco}>
            <Text style={styles.recoTitle}>{recommendation.title}</Text>
            <Text style={styles.recoBody}>{recommendation.message}</Text>
          </View>
        )}

        {warnings.waterLow && (
          <View style={styles.alertBlue}>
            <Text style={styles.alertBlueTitle}>ดื่มน้ำน้อยไปนะ</Text>
            <Text style={styles.alertBlueBody}>ลองเพิ่มน้ำอีกสักแก้วเพื่อให้ถึงเป้าหมายวันนี้</Text>
          </View>
        )}

        {/* Water */}
        <Pressable style={styles.waterRow}>
          <Text style={styles.waterTitle}>น้ำดื่มวันนี้</Text>
          <Text style={styles.waterValue}>
            {(data?.water?.current ?? 0).toLocaleString()} / {(data?.water?.target ?? 0).toLocaleString()} ml
          </Text>
        </Pressable>

        {/* Next meal */}
        <View style={styles.nextMeal}>
          <Text style={styles.nextMealTitle}>มื้อต่อไป</Text>
          <Text style={styles.nextMealLink}>ดูแผนทั้งหมด</Text>
        </View>

        <View style={styles.mealCard}>
          <Text style={styles.mealTime}>{nextMeal?.time ?? "-"}</Text>
          <Text style={styles.mealName}>{nextMeal?.name ?? "-"}</Text>
          <Text style={styles.mealSub}>
            {nextMeal?.kcal ?? 0} kcal {nextMeal?.tag ? `• ${nextMeal.tag}` : ""}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  welcome: { fontSize: 14, color: "#555" },
  name: { fontSize: 28, fontWeight: "700" },
  date: { marginTop: 4, color: "#555" },

  weekLinkWrap: { marginTop: 6 },
  weekLink: { color: "#2e7d32", fontWeight: "800" },

  rightHeader: { alignItems: "flex-end", gap: 10 },

  bellWrap: { position: "relative", padding: 6 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#d00",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  streakPill: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: { color: "#fff", fontWeight: "900" },

  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#d00", fontWeight: "800" },
  bigNumber: { fontSize: 36, fontWeight: "900", marginTop: 6 },
  sub: { color: "#555", marginTop: 4 },

  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    marginLeft: 10,
  },
  circleGreen: { borderColor: "#3aa655" },
  circleRed: { borderColor: "#d00" },
  circleText: { fontSize: 22, fontWeight: "900" },

  macroRow: {
    marginTop: 18,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  macroItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  macroItemBorder: { borderRightWidth: 1, borderRightColor: "#eee" },
  macroLabel: { fontSize: 12, color: "#666", fontWeight: "800" },
  macroValue: { marginTop: 6, fontSize: 16, fontWeight: "900" },

  track: {
    marginTop: 8,
    width: "80%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 8 },
  fillProtein: { backgroundColor: "#1e88e5" },
  fillCarb: { backgroundColor: "#fb8c00" },
  fillFat: { backgroundColor: "#e53935" },

  alertRed: { marginTop: 12, backgroundColor: "#d00", padding: 14, borderRadius: 14 },
  alertTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  alertBody: { color: "#fff", marginTop: 4 },

  reco: { marginTop: 12, backgroundColor: "#b07a2a", padding: 14, borderRadius: 14 },
  recoTitle: { color: "#fff", fontWeight: "900" },
  recoBody: { color: "#fff", marginTop: 6 },

  alertBlue: {
    marginTop: 12,
    backgroundColor: "#e8f1ff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cfe2ff",
  },
  alertBlueTitle: { color: "#1457b3", fontWeight: "900", fontSize: 15 },
  alertBlueBody: { color: "#1457b3", marginTop: 4 },

  waterRow: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  waterTitle: { fontWeight: "900" },
  waterValue: { marginTop: 4, color: "#333", fontWeight: "700" },

  nextMeal: { marginTop: 18, flexDirection: "row", justifyContent: "space-between" },
  nextMealTitle: { fontSize: 18, fontWeight: "900" },
  nextMealLink: { color: "#2e7d32", fontWeight: "800" },

  mealCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mealTime: { color: "#2e7d32", fontWeight: "900" },
  mealName: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  mealSub: { color: "#555", marginTop: 2, fontWeight: "700" },

  // ✅ Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  modalIcon: { fontSize: 44 },
  modalDay: { fontSize: 40, fontWeight: "900", marginTop: 6 },
  modalGreat: { fontSize: 20, fontWeight: "900", marginTop: 6 },
  modalDesc: {
    textAlign: "center",
    color: "#555",
    marginTop: 10,
    lineHeight: 20,
    fontWeight: "600",
  },
  modalButton: {
    marginTop: 16,
    backgroundColor: "#f39c12",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});