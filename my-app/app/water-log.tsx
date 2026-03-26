import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

const ORANGE = "#F28A1A";
const BG = "#F4F4F4";
const WHITE = "#FFFFFF";
const BLUE = "#5A9AF4";
const BLUE_DARK = "#3F7FE0";
const TEXT = "#111111";
const SUBTEXT = "#6E6E6E";
const CARD_BORDER = "#D4D4D4";

const API_BASE = "http://172.16.8.225:3000";

type WaterRecord = {
  time: string;
  amount_ml: number;
  container_type?: "glass" | "bottle";
};

type WaterLogDoc = {
  user_id: string;
  date: string;
  target_ml: number;
  total_drank_ml: number;
  records: WaterRecord[];
};

type CurrentUser = {
  user_id: string;
  username?: string;
  water_target_ml?: number;
  health_goals?: {
    water_target_ml?: number;
  };
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatThaiDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
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

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = (date.getFullYear() + 543).toString().slice(-2);

  return `${day} ${month} ${year}`;
};

const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDateToYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateString: string, offset: number) => {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + offset);
  return formatDateToYMD(date);
};

const getContainerLabel = (containerType?: "glass" | "bottle") => {
  if (containerType === "bottle") return "น้ำเปล่า (ขวด)";
  return "น้ำเปล่า (แก้ว)";
};

export default function WaterLogScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userId, setUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [waterLog, setWaterLog] = useState<WaterLogDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = getTodayDateString();
  const isToday = selectedDate === today;

  const loadCurrentUser = async () => {
    try {
      const possibleKeys = ["loggedInUser", "currentUser", "user", "authUser"];

      for (const key of possibleKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);

        if (parsed?.user_id) {
          setCurrentUser(parsed);
          setUserId(parsed.user_id);
          return;
        }

        if (parsed?.user?.user_id) {
          setCurrentUser(parsed.user);
          setUserId(parsed.user.user_id);
          return;
        }
      }

      setCurrentUser(null);
      setUserId("");
    } catch (error) {
      console.error("loadCurrentUser error:", error);
      setCurrentUser(null);
      setUserId("");
    }
  };

  const fetchWaterLog = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/water-logs/daily/${userId}?date=${selectedDate}`
      );
      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || "ไม่สามารถดึงข้อมูลน้ำดื่มได้");
      }

      setWaterLog(res.waterLog);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchWaterLog();
  }, [userId, selectedDate]);

  const totalMl = waterLog?.total_drank_ml || 0;
  const targetMl =
    waterLog?.target_ml ||
    currentUser?.water_target_ml ||
    currentUser?.health_goals?.water_target_ml ||
    2000;

  const progress = useMemo(() => {
    if (!targetMl || targetMl <= 0) return 0;
    return Math.min(totalMl / targetMl, 1);
  }, [totalMl, targetMl]);

  const progressPercent = Math.round(progress * 100);

  const addWaterLog = async (
    amount: number,
    containerType: "glass" | "bottle"
  ) => {
    if (!isToday) {
      Alert.alert(
        "ไม่สามารถบันทึกได้",
        "สามารถบันทึกน้ำได้เฉพาะวันปัจจุบันเท่านั้น"
      );
      return;
    }

    if (!userId) {
      Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/water-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          date: selectedDate,
          amount_ml: amount,
          container_type: containerType,
        }),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || "ไม่สามารถบันทึกการดื่มน้ำได้");
      }

      setWaterLog(res.waterLog);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "บันทึกน้ำไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const deleteWaterRecord = async (index: number) => {
    if (!isToday) {
      Alert.alert(
        "ไม่สามารถลบได้",
        "สามารถลบรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น"
      );
      return;
    }

    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/water-logs/${userId}/${selectedDate}/${index}`,
        {
          method: "DELETE",
        }
      );

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || "ไม่สามารถลบรายการได้");
      }

      setWaterLog(res.waterLog);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "ลบรายการไม่สำเร็จ");
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    pickedDate?: Date
  ) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed") return;
    if (!pickedDate) return;

    const nextDate = formatDateToYMD(pickedDate);
    const todayString = getTodayDateString();

    if (nextDate > todayString) {
      setSelectedDate(todayString);
      return;
    }

    setSelectedDate(nextDate);
  };

  const handlePrevDay = () => {
    setSelectedDate((prev) => shiftDate(prev, -1));
  };

  const handleNextDay = () => {
    const nextDate = shiftDate(selectedDate, 1);
    if (nextDate > today) return;
    setSelectedDate(nextDate);
  };

  const handlePressDelete = (index: number, item: WaterRecord) => {
    if (!isToday) {
      Alert.alert(
        "ไม่สามารถลบได้",
        "สามารถลบรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น"
      );
      return;
    }

    Alert.alert(
      "ลบรายการน้ำดื่ม",
      `ต้องการลบรายการ ${item.amount_ml} ml เวลา ${item.time} หรือไม่`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => deleteWaterRecord(index),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={26} color={TEXT} />
        </TouchableOpacity>

        <View style={styles.datePill}>
          <TouchableOpacity activeOpacity={0.8} onPress={handlePrevDay}>
            <Ionicons name="chevron-back" size={22} color={BLUE} />
          </TouchableOpacity>

          <Text style={styles.dateText}>{formatThaiDateLabel(selectedDate)}</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={18} color="#E21B1B" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={handleNextDay}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={selectedDate === today ? "#CFCFCF" : BLUE}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color={BLUE_DARK} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={parseDateString(selectedDate)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.ringWrap}>
              <View style={styles.ringBase} />
              <View style={styles.ringFill}>
                <Ionicons name="water" size={42} color={BLUE_DARK} />
                <Text style={styles.totalMlText}>{totalMl.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.targetText}>
              เป้าหมาย: {targetMl.toLocaleString()} ml
            </Text>

            <Text style={styles.progressText}>{progressPercent}% ของเป้าหมาย</Text>

            {!isToday && (
              <Text style={styles.readonlyText}>
                วันที่นี้ดูประวัติได้อย่างเดียว แก้ไขหรือบันทึกเพิ่มไม่ได้
              </Text>
            )}

            <View style={styles.quickAddRow}>
              <TouchableOpacity
                style={[
                  styles.quickAddButton,
                  !isToday && styles.quickAddButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => addWaterLog(250, "glass")}
                disabled={saving || !isToday}
              >
                <View style={styles.plusCircle}>
                  <Ionicons name="add" size={28} color={BLUE} />
                </View>
                <Text style={styles.quickAddText}>แก้ว (250ml)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickAddButton,
                  !isToday && styles.quickAddButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => addWaterLog(600, "bottle")}
                disabled={saving || !isToday}
              >
                <View style={styles.plusCircle}>
                  <Ionicons name="add" size={28} color={BLUE} />
                </View>
                <Text style={styles.quickAddText}>ขวด (600ml)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>บันทึกการดื่ม</Text>

          <View style={styles.listWrap}>
            {(waterLog?.records || []).map((item, index) => (
              <View
                key={`${item.time}-${item.amount_ml}-${index}`}
                style={styles.logCard}
              >
                <Text style={styles.logTime}>{item.time}</Text>

                <View style={styles.logMiddle}>
                  <Text style={styles.logTitle}>
                    {getContainerLabel(item.container_type)}
                  </Text>
                  <Text style={styles.logSubtitle}>ปริมาณน้ำ</Text>
                </View>

                <View style={styles.logRight}>
                  <Text style={styles.logAmount}>+{item.amount_ml} ml</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePressDelete(index, item)}
                    disabled={!isToday}
                    style={styles.deleteIconButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={!isToday ? "#C8C8C8" : "#D9534F"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {(!waterLog?.records || waterLog.records.length === 0) && (
              <Text style={styles.emptyText}>ยังไม่มีบันทึกการดื่มน้ำในวันนี้</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const RING_SIZE = 210;
const RING_THICKNESS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  topBar: {
    height: 56,
    backgroundColor: ORANGE,
  },

  header: {
    paddingHorizontal: 10,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  datePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  dateText: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },

  bellButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  summaryCard: {
    marginTop: 16,
    marginHorizontal: 6,
    backgroundColor: "#F1F1F1",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  ringBase: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: "#CFE0FB",
  },

  ringFill: {
    width: RING_SIZE - 40,
    height: RING_SIZE - 40,
    borderRadius: (RING_SIZE - 40) / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },

  totalMlText: {
    marginTop: 4,
    fontSize: 42,
    fontWeight: "900",
    color: BLUE,
  },

  targetText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#6D6D6D",
  },

  progressText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#6D6D6D",
  },

  readonlyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#C06A00",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  quickAddRow: {
    marginTop: 14,
    width: "100%",
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  quickAddButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  quickAddButtonDisabled: {
    opacity: 0.45,
  },

  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  quickAddText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6A6A6A",
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: 18,
    marginHorizontal: 28,
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
  },

  listWrap: {
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 18,
  },

  logCard: {
    minHeight: 82,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#2C2C2C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  logTime: {
    width: 72,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
  },

  logMiddle: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },

  logTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  logSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: SUBTEXT,
  },

  logRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },

  logAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4B89F7",
  },

  deleteIconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    textAlign: "center",
    color: SUBTEXT,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
});