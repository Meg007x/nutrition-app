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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../constants/config";

type BackendDashboardDTO = {
  userName: string;
  streakDays: number;
  calories: {
    target: number;
    consumed: number;
    percentage: number;
  };
  macros: {
    protein: { current: number; target: number };
    carb: { current: number; target: number };
    fat: { current: number; target: number };
  };
  water?: { current: number; target: number };
  nextMeal?: {
    time?: string;
    name?: string;
    kcal?: number;
    tag?: string;
  } | null;
  recommendation?: {
    title: string;
    message: string;
  } | null;
};

type StoredUser = {
  user_id?: string;
  username?: string;
  email?: string;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const fmtTHDate = () => new Date().toLocaleDateString("th-TH");

export default function DashboardScreen() {
  const [data, setData] = useState<BackendDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const userId =
    currentUser?.user_id || currentUser?.email || currentUser?.username || null;

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("currentUser");
        if (!mounted) return;

        if (raw) {
          const parsed = JSON.parse(raw);
          setCurrentUser(parsed);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.log("อ่าน currentUser ไม่ได้:", error);
        if (mounted) setCurrentUser(null);
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const fetchDashboard = async () => {
      try {
        if (!userId) {
          if (alive) setLoading(false);
          return;
        }

        setLoading(true);

        const response = await fetch(
          `${BASE_URL}/api/dashboard/${encodeURIComponent(userId)}`
        );
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "โหลดข้อมูล dashboard ไม่สำเร็จ");
        }

        if (alive) setData(json as BackendDashboardDTO);
      } catch (error) {
        console.log("โหลด dashboard ไม่ได้:", error);
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      alive = false;
    };
  }, [userId]);

  const kcalPct = useMemo(() => {
    const p = data?.calories?.percentage ?? 0;
    return Number.isFinite(p) ? p : 0;
  }, [data]);

  const isOver = useMemo(() => {
    const c = data?.calories?.consumed ?? 0;
    const t = data?.calories?.target ?? 0;
    return c > t && t > 0;
  }, [data]);

  const carbNearLimit = useMemo(() => {
    const cur = data?.macros?.carb?.current ?? 0;
    const tar = data?.macros?.carb?.target ?? 1;
    return cur >= tar * 0.9;
  }, [data]);

  const waterLow = useMemo(() => {
    const cur = data?.water?.current ?? 0;
    const tar = data?.water?.target ?? 0;
    if (!tar) return false;
    return cur < tar * 0.4;
  }, [data]);

  const warnings = useMemo(() => {
    return {
      kcalOver: isOver,
      carbNearLimit: !isOver && carbNearLimit,
      waterLow,
    };
  }, [isOver, carbNearLimit, waterLow]);

  const notificationCount = useMemo(() => {
    return [warnings.kcalOver, warnings.carbNearLimit, warnings.waterLow].filter(
      Boolean
    ).length;
  }, [warnings]);

  const recommendation = useMemo(() => {
    if (data?.recommendation) return data.recommendation;

    if (warnings.carbNearLimit) {
      return {
        title: "คำแนะนำมื้อเย็น",
        message:
          "คาร์บของคุณใกล้เต็มแล้ว มื้อเย็นแนะนำให้เลี่ยงข้าวหรือเส้น และเน้นโปรตีนกับผัก",
      };
    }

    return null;
  }, [data, warnings.carbNearLimit]);

  const proteinRatio = useMemo(() => {
    const cur = data?.macros?.protein?.current ?? 0;
    const tar = data?.macros?.protein?.target ?? 1;
    return clamp01(cur / Math.max(1, tar));
  }, [data]);

  const carbRatio = useMemo(() => {
    const cur = data?.macros?.carb?.current ?? 0;
    const tar = data?.macros?.carb?.target ?? 1;
    return clamp01(cur / Math.max(1, tar));
  }, [data]);

  const fatRatio = useMemo(() => {
    const cur = data?.macros?.fat?.current ?? 0;
    const tar = data?.macros?.fat?.target ?? 1;
    return clamp01(cur / Math.max(1, tar));
  }, [data]);

  const streakDays = data?.streakDays ?? 0;
  const waterCurrent = data?.water?.current ?? 0;
  const waterTarget = data?.water?.target ?? 0;

  const nextMeal = useMemo(() => {
    const meal = data?.nextMeal;
    if (!meal) return null;

    return {
      time: meal.time ?? "-",
      name: meal.name ?? "-",
      kcal: meal.kcal ?? 0,
      tag: meal.tag ?? "",
    };
  }, [data]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>ยังไม่พบข้อมูลผู้ใช้</Text>
          <Text style={styles.emptyDesc}>กรุณาเข้าสู่ระบบใหม่อีกครั้ง</Text>

          <Pressable
            style={styles.loginAgainButton}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginAgainText}>ไปหน้าเข้าสู่ระบบ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Modal
        visible={showStreakModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStreakModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalIcon}>🔥</Text>
            <Text style={styles.modalDay}>{streakDays} วัน</Text>
            <Text style={styles.modalGreat}>สุดยอดมาก</Text>
            <Text style={styles.modalDesc}>
              คุณทำตามเป้าหมายต่อเนื่องมาแล้ว {streakDays} วัน{"\n"}
              พยายามรักษาวินัยต่อไปเพื่อสุขภาพที่ดี
            </Text>

            <Pressable
              style={styles.modalButton}
              onPress={() => setShowStreakModal(false)}
            >
              <Text style={styles.modalButtonText}>ไปลุยต่อ!</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcome}>ยินดีต้อนรับ</Text>
            <Text style={styles.name}>คุณ {data?.userName ?? "-"}</Text>
            <Text style={styles.date}>{fmtTHDate()}</Text>

            <Pressable
              style={styles.weekLinkWrap}
              onPress={() => router.push("/weekly")}
            >
              <Text style={styles.weekLink}>ดูภาพรวมรายสัปดาห์ ›</Text>
            </Pressable>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.bellWrap}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name={
                  notificationCount > 0
                    ? "notifications"
                    : "notifications-outline"
                }
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

            <Pressable
              style={styles.streakPill}
              onPress={() => setShowStreakModal(true)}
            >
              <Text style={styles.streakText}>🔥 ต่อเนื่อง {streakDays} วัน</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ภาพรวมวันนี้</Text>

          <View style={styles.rowBetween}>
            <View style={styles.summaryLeft}>
              <Text style={styles.label}>กินไปแล้ว (Kcal)</Text>
              <Text
                style={[styles.bigNumber, warnings.kcalOver && styles.textDanger]}
              >
                {data?.calories?.consumed ?? 0}
              </Text>
              <Text style={styles.sub}>
                เป้าหมาย: {data?.calories?.target ?? 0} Kcal
              </Text>
            </View>

            <View
              style={[
                styles.circle,
                warnings.kcalOver ? styles.circleRed : styles.circleGreen,
              ]}
            >
              <Text style={styles.circleText}>{kcalPct}%</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>โปรตีน</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.protein?.current ?? 0}/
                {data?.macros?.protein?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    styles.fillProtein,
                    { width: `${Math.round(proteinRatio * 100)}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.sep} />

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>คาร์บ</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.carb?.current ?? 0}/
                {data?.macros?.carb?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    styles.fillCarb,
                    { width: `${Math.round(carbRatio * 100)}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.sep} />

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>ไขมัน</Text>
              <Text style={styles.macroValue}>
                {data?.macros?.fat?.current ?? 0}/
                {data?.macros?.fat?.target ?? 0}g
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    styles.fillFat,
                    { width: `${Math.round(fatRatio * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {warnings.kcalOver && (
          <View style={styles.alertRed}>
            <Text style={styles.alertTitle}>แคลอรี่ของคุณเกินแล้ว</Text>
            <Text style={styles.alertBody}>วันนี้คุณทานเกินเป้าหมายแล้ว</Text>
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
            <Text style={styles.alertBlueBody}>
              ลองเพิ่มน้ำอีกสักแก้วเพื่อให้ถึงเป้าหมายวันนี้
            </Text>
          </View>
        )}

        <Pressable style={styles.waterRow}>
          <View style={styles.waterLeft}>
            <View style={styles.waterIcon}>
              <Ionicons name="water" size={18} color="#2a6ef7" />
            </View>

            <View style={styles.waterTextWrap}>
              <Text style={styles.waterTitle}>น้ำดื่มวันนี้</Text>
              <Text style={styles.waterValue}>
                {waterCurrent.toLocaleString()} / {waterTarget.toLocaleString()} ml
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#999" />
        </Pressable>

        <View style={styles.nextMealHeader}>
          <Text style={styles.nextMealTitle}>มื้อต่อไป</Text>
          <Pressable onPress={() => router.push("/plan")}>
            <Text style={styles.nextMealLink}>ดูแผนทั้งหมด</Text>
          </Pressable>
        </View>

        <View style={styles.mealCard}>
          <Text style={styles.mealTime}>{nextMeal?.time ?? "-"}</Text>
          <Text style={styles.mealName}>{nextMeal?.name ?? "-"}</Text>
          <Text style={styles.mealSub}>
            {nextMeal?.kcal ?? 0} kcal
            {nextMeal?.tag ? ` • ${nextMeal.tag}` : ""}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  loginAgainButton: {
    marginTop: 16,
    backgroundColor: "#F5A400",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginAgainText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
  },
  welcome: {
    fontSize: 14,
    color: "#555",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  date: {
    marginTop: 4,
    color: "#555",
  },
  weekLinkWrap: {
    marginTop: 6,
  },
  weekLink: {
    color: "#2e7d32",
    fontWeight: "800",
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  bellWrap: {
    position: "relative",
    padding: 6,
  },
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
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  streakPill: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: "#fff",
    fontWeight: "900",
  },
  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    color: "#111",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  summaryLeft: {
    flex: 1,
  },
  label: {
    color: "#d00",
    fontWeight: "800",
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: "900",
    marginTop: 6,
    color: "#111",
  },
  textDanger: {
    color: "#d00",
  },
  sub: {
    color: "#555",
    marginTop: 4,
  },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
  },
  circleGreen: {
    borderColor: "#3aa655",
  },
  circleRed: {
    borderColor: "#d00",
  },
  circleText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
  },
  macroRow: {
    marginTop: 18,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    alignItems: "center",
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sep: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#eee",
    marginHorizontal: 6,
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "800",
  },
  macroValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },
  track: {
    marginTop: 8,
    width: "100%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 8,
  },
  fillProtein: {
    backgroundColor: "#1e88e5",
  },
  fillCarb: {
    backgroundColor: "#fb8c00",
  },
  fillFat: {
    backgroundColor: "#e53935",
  },
  alertRed: {
    marginTop: 12,
    backgroundColor: "#d00",
    padding: 14,
    borderRadius: 14,
  },
  alertTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  alertBody: {
    color: "#fff",
    marginTop: 4,
  },
  reco: {
    marginTop: 12,
    backgroundColor: "#b07a2a",
    padding: 14,
    borderRadius: 14,
  },
  recoTitle: {
    color: "#fff",
    fontWeight: "900",
  },
  recoBody: {
    color: "#fff",
    marginTop: 6,
  },
  alertBlue: {
    marginTop: 12,
    backgroundColor: "#e8f1ff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cfe2ff",
  },
  alertBlueTitle: {
    color: "#1457b3",
    fontWeight: "900",
    fontSize: 15,
  },
  alertBlueBody: {
    color: "#1457b3",
    marginTop: 4,
  },
  waterRow: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  waterIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  waterTextWrap: {
    flex: 1,
  },
  waterTitle: {
    fontWeight: "900",
    color: "#111",
  },
  waterValue: {
    marginTop: 4,
    color: "#333",
    fontWeight: "700",
  },
  nextMealHeader: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextMealTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  nextMealLink: {
    color: "#2e7d32",
    fontWeight: "800",
  },
  mealCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mealTime: {
    color: "#2e7d32",
    fontWeight: "900",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
    color: "#111",
  },
  mealSub: {
    color: "#555",
    marginTop: 2,
    fontWeight: "700",
  },
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
  modalIcon: {
    fontSize: 44,
  },
  modalDay: {
    fontSize: 40,
    fontWeight: "900",
    marginTop: 6,
    color: "#111",
  },
  modalGreat: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
    color: "#111",
  },
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
  modalButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});