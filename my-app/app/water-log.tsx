import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  styles,
  BLUE,
  BLUE_DARK,
  TEXT,
  WHITE,
} from "../style/water-log.styles";
import { BASE_URL } from "../constants/config";
import {
  notifyWaterGoalReached,
  startWebWaterReminderTimer,
  syncWaterReminderSchedule,
} from "../utils/notificationService";

type WaterRecord = {
  time: string;
  amount_ml: number;
  container_type?: "glass" | "bottle";
  last_edited_at?: string;
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
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
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

const getWaterReminderPreferenceKey = (id: string) =>
  `water_reminders_enabled_${id}`;

export default function WaterLogScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userId, setUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [waterLog, setWaterLog] = useState<WaterLogDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    index: number;
    item: WaterRecord;
  } | null>(null);
  const [itemToEdit, setItemToEdit] = useState<{
    index: number;
    item: WaterRecord;
  } | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPickerTime, setEditPickerTime] = useState("");
  const [editContainerType, setEditContainerType] = useState<"glass" | "bottle">("glass");
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editError, setEditError] = useState("");
  const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(false);
  const [reminderPreferenceLoaded, setReminderPreferenceLoaded] = useState(false);

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

  const fetchWaterLog = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/water-logs/daily/${userId}?date=${selectedDate}`
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
  }, [userId, selectedDate]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    fetchWaterLog();
  }, [fetchWaterLog]);

  useEffect(() => {
    if (!userId) {
      setReminderPreferenceLoaded(false);
      return;
    }

    let active = true;
    AsyncStorage.getItem(getWaterReminderPreferenceKey(userId))
      .then((value) => {
        if (active) setWaterRemindersEnabled(value === "true");
      })
      .catch((error) => {
        console.error("Load water reminder preference error:", error);
      })
      .finally(() => {
        if (active) setReminderPreferenceLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

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

  useEffect(() => {
    if (!userId || !isToday || !reminderPreferenceLoaded) return;

    let cancelled = false;
    let stopWebTimer = () => {};
    syncWaterReminderSchedule({
      userId,
      enabled: waterRemindersEnabled,
      totalMl,
      targetMl,
    })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          console.error("Water reminder permission is not granted");
        }
        if (
          Platform.OS === "web" &&
          waterRemindersEnabled &&
          !result.completed
        ) {
          stopWebTimer = startWebWaterReminderTimer({ totalMl, targetMl });
        }
      })
      .catch((error) => {
        console.error("Sync water reminder schedule error:", error);
      });

    return () => {
      cancelled = true;
      stopWebTimer();
    };
  }, [
    userId,
    isToday,
    reminderPreferenceLoaded,
    waterRemindersEnabled,
    totalMl,
    targetMl,
  ]);

  const addWaterLog = async (
    amount: number,
    containerType: "glass" | "bottle"
  ) => {
    if (!isToday) {
      if (Platform.OS === "web") {
        window.alert("ไม่สามารถบันทึกได้\nสามารถบันทึกน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      } else {
        Alert.alert("ไม่สามารถบันทึกได้", "สามารถบันทึกน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      }
      return;
    }

    if (!userId) {
      Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${BASE_URL}/api/water-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      void notifyWaterGoalReached({
        userId,
        date: new Date(),
        previousTotalMl: totalMl,
        totalMl: Number(res.waterLog?.total_drank_ml || 0),
        targetMl,
        enabled: waterRemindersEnabled,
      }).catch((error) => console.error("Notify water goal completion error:", error));
      setWaterLog(res.waterLog);
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", error.message || "บันทึกน้ำไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const deleteWaterRecord = async (index: number) => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${BASE_URL}/api/water-logs/${userId}/${selectedDate}/${index}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
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

  const handlePressEdit = (index: number, item: WaterRecord) => {
    if (!isToday) {
      if (Platform.OS === "web") {
        window.alert("ไม่สามารถแก้ไขได้\nสามารถแก้ไขรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      } else {
        Alert.alert("ไม่สามารถแก้ไขได้", "สามารถแก้ไขรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      }
      return;
    }

    setItemToEdit({ index, item });
    setEditAmount(String(item.amount_ml));
    setEditTime(item.time);
    setEditContainerType(item.container_type || "glass");
    setEditError("");
  };

  const cancelEdit = () => {
    setItemToEdit(null);
    setEditAmount("");
    setEditTime("");
    setEditPickerTime("");
    setShowEditTimePicker(false);
    setEditError("");
  };

  const openEditTimePicker = () => {
    setEditPickerTime(editTime);
    setShowEditTimePicker(true);
  };

  const selectEditTimePart = (part: "hours" | "minutes", value: number) => {
    const [selectedHours, selectedMinutes] = editPickerTime.split(":").map(Number);
    const nextHours = part === "hours" ? value : selectedHours;
    let nextMinutes = part === "minutes" ? value : selectedMinutes;
    const now = new Date();

    if (isToday) {
      if (nextHours > now.getHours()) return;
      if (nextHours === now.getHours() && nextMinutes > now.getMinutes()) {
        if (part === "hours") {
          nextMinutes = now.getMinutes();
        } else {
          return;
        }
      }
    }

    setEditPickerTime(
      `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`
    );
  };

  const confirmEditTime = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (isToday && editPickerTime > currentTime) {
      Alert.alert("เวลาไม่ถูกต้อง", "ไม่สามารถเลือกเวลาในอนาคตได้");
      return;
    }
    setEditTime(editPickerTime);
    setShowEditTimePicker(false);
  };

  const saveWaterRecord = async () => {
    if (!userId || !itemToEdit) return;
    setEditError("");

    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("ปริมาณน้ำต้องมากกว่า 0 ml");
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(editTime)) {
      setEditError("กรุณาเลือกเวลาให้ถูกต้อง");
      return;
    }
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (isToday && editTime > currentTime) {
      setEditError("ไม่สามารถเลือกเวลาในอนาคตได้");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `${BASE_URL}/api/water-logs/${userId}/${selectedDate}/${itemToEdit.index}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount_ml: amount,
            time: editTime,
            container_type: editContainerType,
          }),
        }
      );
      const responseText = await response.text();
      let res: { success?: boolean; error?: string; waterLog?: WaterLogDoc };
      try {
        res = JSON.parse(responseText);
      } catch {
        throw new Error(`เซิร์ฟเวอร์ส่งคำตอบที่อ่านไม่ได้ (HTTP ${response.status})`);
      }
      if (!response.ok || !res.success || !res.waterLog) {
        throw new Error(res.error || `บันทึกไม่สำเร็จ (HTTP ${response.status})`);
      }
      void notifyWaterGoalReached({
        userId,
        date: new Date(),
        previousTotalMl: totalMl,
        totalMl: Number(res.waterLog.total_drank_ml || 0),
        targetMl,
        enabled: waterRemindersEnabled,
      }).catch((error) => console.error("Notify water goal completion error:", error));
      setWaterLog(res.waterLog);
      cancelEdit();
    } catch (error: any) {
      const message = error.message || "แก้ไขรายการไม่สำเร็จ";
      setEditError(message);
      if (Platform.OS === "web") {
        window.alert(`บันทึกไม่สำเร็จ\n${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    pickedDate?: Date
  ) => {
    if (Platform.OS !== "ios") setShowDatePicker(false);
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

  const handlePrevDay = () => setSelectedDate((prev) => shiftDate(prev, -1));

  const handleNextDay = () => {
    const nextDate = shiftDate(selectedDate, 1);
    if (nextDate > today) return;
    setSelectedDate(nextDate);
  };

  const handlePressDelete = (index: number, item: WaterRecord) => {
    if (!isToday) {
      if (Platform.OS === "web") {
        window.alert("ไม่สามารถลบได้\nสามารถลบรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      } else {
        Alert.alert("ไม่สามารถลบได้", "สามารถลบรายการน้ำได้เฉพาะวันปัจจุบันเท่านั้น");
      }
      return;
    }
    setItemToDelete({ index, item });
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      deleteWaterRecord(itemToDelete.index);
    }
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
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

          <Text style={styles.dateText}>
            {formatThaiDateLabel(selectedDate)}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={18} color="#E21B1B" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={handleNextDay}>
            <Ionicons name="chevron-forward" size={22} color={selectedDate === today ? "#CFCFCF" : BLUE} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color={BLUE_DARK} />
        </TouchableOpacity>
      </View>

      {showDatePicker && Platform.OS !== "web" && (
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.ringWrap}>
              <View style={styles.ringBase} />
              <View style={styles.ringFill}>
                <Ionicons name="water" size={42} color={BLUE_DARK} />
                <Text style={styles.totalMlText}>{totalMl.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.targetText}>เป้าหมาย: {targetMl.toLocaleString()} ml</Text>
            <Text style={styles.progressText}>{progressPercent}% ของเป้าหมาย</Text>

            {!isToday && (
              <Text style={styles.readonlyText}>
                วันที่นี้ดูประวัติได้อย่างเดียว แก้ไขหรือบันทึกเพิ่มไม่ได้
              </Text>
            )}

            <View style={styles.quickAddRow}>
              <TouchableOpacity
                style={[styles.quickAddButton, !isToday && styles.quickAddButtonDisabled]}
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
                style={[styles.quickAddButton, !isToday && styles.quickAddButtonDisabled]}
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
              <View key={`${item.time}-${item.amount_ml}-${index}`} style={styles.logCard}>
                <Text style={styles.logTime}>{item.time}</Text>
                <View style={styles.logMiddle}>
                  <Text style={styles.logTitle}>{getContainerLabel(item.container_type)}</Text>
                  <Text style={styles.logSubtitle}>ปริมาณน้ำ</Text>
                  {item.last_edited_at && (
                    <Text style={styles.logEditedAt}>
                      แก้ไขล่าสุด {new Date(item.last_edited_at).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} น.
                    </Text>
                  )}
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logAmount}>+{item.amount_ml} ml</Text>
                  <View style={styles.logActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePressEdit(index, item)}
                      disabled={!isToday}
                      style={styles.deleteIconButton}
                      accessibilityLabel="แก้ไขรายการน้ำ"
                    >
                      <Ionicons name="create-outline" size={18} color={!isToday ? "#C8C8C8" : BLUE} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePressDelete(index, item)}
                      disabled={!isToday}
                      style={styles.deleteIconButton}
                      accessibilityLabel="ลบรายการน้ำ"
                    >
                      <Ionicons name="trash-outline" size={18} color={!isToday ? "#C8C8C8" : "#D9534F"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {(!waterLog?.records || waterLog.records.length === 0) && (
              <Text style={styles.emptyText}>ยังไม่มีบันทึกการดื่มน้ำในวันนี้</Text>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-bin-outline" size={32} color="#D9534F" />
            </View>
            <Text style={styles.modalTitle}>ลบรายการนี้?</Text>
            <Text style={styles.modalMessage}>
              คุณต้องการลบรายการดื่มน้ำปริมาณ {itemToDelete?.item.amount_ml} ml (เวลา {itemToDelete?.item.time}) ใช่หรือไม่?
            </Text>
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelBtn]}
                onPress={cancelDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmBtn]}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>ลบรายการ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={itemToEdit !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.editModalIconWrap}>
              <Ionicons name="water-outline" size={30} color={BLUE} />
            </View>
            <Text style={styles.modalTitle}>แก้ไขรายการน้ำ</Text>

            <Text style={styles.editFieldLabel}>ปริมาณ (ml)</Text>
            <TextInput
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="decimal-pad"
              style={styles.editInput}
              placeholder="เช่น 250"
              accessibilityLabel="ปริมาณน้ำ มิลลิลิตร"
            />

            <Text style={styles.editFieldLabel}>เวลา (ชั่วโมง:นาที)</Text>
            <TouchableOpacity
              style={styles.editTimeButton}
              onPress={openEditTimePicker}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`เลือกเวลาดื่มน้ำ ${editTime}`}
            >
              <Text style={styles.editTimeText}>{editTime} น.</Text>
              <Ionicons name="time-outline" size={20} color={BLUE_DARK} />
            </TouchableOpacity>
            {showEditTimePicker && (
              <View style={styles.timePickerWrap}>
                <View style={styles.timePickerColumns}>
                  <View style={styles.timePickerColumnWrap}>
                    <Text style={styles.timePickerColumnTitle}>ชั่วโมง</Text>
                    <ScrollView
                      style={styles.timePickerColumn}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {Array.from({ length: 24 }, (_, hour) => {
                        const [selectedHours] = editPickerTime.split(":").map(Number);
                        const disabled = isToday && hour > new Date().getHours();
                        const selected = hour === selectedHours;
                        return (
                          <TouchableOpacity
                            key={hour}
                            style={[styles.timePickerOption, selected && styles.timePickerOptionSelected]}
                            onPress={() => selectEditTimePart("hours", hour)}
                            disabled={disabled}
                            accessibilityState={{ disabled, selected }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selected && styles.timePickerOptionTextSelected,
                              disabled && styles.timePickerOptionTextDisabled,
                            ]}>
                              {String(hour).padStart(2, "0")}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  <View style={styles.timePickerColumnWrap}>
                    <Text style={styles.timePickerColumnTitle}>นาที</Text>
                    <ScrollView
                      style={styles.timePickerColumn}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {Array.from({ length: 60 }, (_, minute) => {
                        const [selectedHours, selectedMinutes] = editPickerTime.split(":").map(Number);
                        const now = new Date();
                        const disabled = isToday &&
                          (selectedHours > now.getHours() ||
                            (selectedHours === now.getHours() && minute > now.getMinutes()));
                        const selected = minute === selectedMinutes;
                        return (
                          <TouchableOpacity
                            key={minute}
                            style={[styles.timePickerOption, selected && styles.timePickerOptionSelected]}
                            onPress={() => selectEditTimePart("minutes", minute)}
                            disabled={disabled}
                            accessibilityState={{ disabled, selected }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selected && styles.timePickerOptionTextSelected,
                              disabled && styles.timePickerOptionTextDisabled,
                            ]}>
                              {String(minute).padStart(2, "0")}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.timePickerDoneButton}
                  onPress={confirmEditTime}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timePickerDoneText}>เสร็จสิ้น</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.editFieldLabel}>ภาชนะ</Text>
            <View style={styles.containerTypeRow}>
              {(["glass", "bottle"] as const).map((containerType) => {
                const selected = editContainerType === containerType;
                return (
                  <TouchableOpacity
                    key={containerType}
                    style={[
                      styles.containerTypeButton,
                      selected && styles.containerTypeButtonSelected,
                    ]}
                    onPress={() => {
                      setEditContainerType(containerType);
                      setEditAmount(containerType === "glass" ? "250" : "600");
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.containerTypeText,
                        selected && styles.containerTypeTextSelected,
                      ]}
                    >
                      {containerType === "glass" ? "แก้ว" : "ขวด"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelBtn]}
                onPress={cancelEdit}
                activeOpacity={0.8}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.editConfirmBtn]}
                onPress={saveWaterRecord}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.modalConfirmText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
            {editError ? (
              <Text style={styles.editErrorText}>{editError}</Text>
            ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}