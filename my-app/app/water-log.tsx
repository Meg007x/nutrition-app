import React, { useEffect, useMemo, useState } from "react";
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
} from "../style/water-log.styles";
import { BASE_URL } from "../constants/config";

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
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logAmount}>+{item.amount_ml} ml</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePressDelete(index, item)}
                    disabled={!isToday}
                    style={styles.deleteIconButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={!isToday ? "#C8C8C8" : "#D9534F"} />
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
    </SafeAreaView>
  );
}