import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from '../../components/themed-text'; 
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";


export default function RegisterStep1Screen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [tempBirthDate, setTempBirthDate] = useState<Date>(new Date(2004, 4, 14));
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePickerIOS, setShowDatePickerIOS] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return "";

    const day = birthDate.getDate();
    const month = birthDate.toLocaleString("th-TH", { month: "long" });
    const year = birthDate.getFullYear(); // ค.ศ.

    return `${day} ${month} ${year}`;
  }, [birthDate]);

  const openDateModal = () => {
    setTempBirthDate(birthDate || new Date(2004, 4, 14));

    if (Platform.OS === "ios") {
      setShowDateModal(true);
      setShowDatePickerIOS(true);
    } else {
      setShowDateModal(true);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setTempBirthDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempBirthDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    setBirthDate(tempBirthDate);
    setShowDateModal(false);
    setShowDatePickerIOS(false);
  };

  const handleCancelDate = () => {
    setShowDateModal(false);
    setShowDatePickerIOS(false);
  };

  const handleNext = () => {
    if (!username || !email || !birthDate || !gender || !password || !confirmPassword) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจสอบรหัสผ่านอีกครั้ง");
      return;
    }

    router.push("/register/step2");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.homeBackButton} onPress={() => router.replace("/")}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <ThemedText style={styles.homeBackThemedThemedText}>หน้าแรก</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerBarThemedThemedText}>ลงทะเบียนผู้ใช้งาน</ThemedText>
      </View>
   

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.stepTitle}>1.ข้อมูลพื้นฐาน</ThemedText>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <View style={styles.formCard}>
          <ThemedText style={styles.label}>ชื่อผู้ใช้</ThemedText>
          <TextInput
            style={styles.fullInput}
            value={username}
            onChangeText={setUsername}
            placeholder="กรอกชื่อผู้ใช้"
            placeholderTextColor="#8A8A8A"
          />

          <ThemedText style={styles.label}>อีเมล</ThemedText>
        <TextInput
            style={styles.fullInput}
            value={email}
            onChangeText={setEmail}
            placeholder="กรอกอีเมล"
            placeholderTextColor="#8A8A8A"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ThemedText style={styles.label}>วันเกิด</ThemedText>
          <View style={styles.birthRow}>
            <Pressable style={styles.birthInputButton} onPress={openDateModal}>
              <ThemedText style={[styles.birthInputThemedThemedText, !formattedBirthDate && styles.placeholderThemedThemedText]}>
                {formattedBirthDate || "เลือกวัน / เดือน / ปี"}
              </ThemedText>
            </Pressable>

            <TouchableOpacity style={styles.calendarButton} onPress={openDateModal}>
              <Ionicons name="calendar-outline" size={28} color="#111" />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.label}>เพศ</ThemedText>
          <TouchableOpacity style={styles.genderBox} onPress={() => setShowGenderModal(true)}>
            <ThemedText style={[styles.genderThemedThemedText, !gender && styles.placeholderThemedThemedText]}>
              {gender || "เลือกเพศ"}
            </ThemedText>
            <Ionicons name="chevron-down" size={20} color="#777" />
          </TouchableOpacity>

          <View style={styles.spacer} />

          <ThemedText style={styles.label}>รหัสผ่าน</ThemedText>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="กรอกรหัสผ่าน"
              placeholderTextColor="#8A8A8A"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#444"
              />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.label}>ยืนยันรหัสผ่าน</ThemedText>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              placeholderTextColor="#8A8A8A"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#444"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonThemedThemedText}>ถัดไป</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalCard}>
            <View style={styles.dateModalHeader}>
              <ThemedText style={styles.dateModalTitle}>เลือกวันเกิด</ThemedText>
            </View>

            <View style={styles.datePickerWrap}>
              {Platform.OS === "ios" ? (
                showDatePickerIOS && (
                  <DateTimePicker
                    value={tempBirthDate}
                    mode="date"
                    display="spinner"
                    themeVariant="light"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )
              ) : (
                <DateTimePicker
                  value={tempBirthDate}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={{ backgroundColor: "#fff" }}
                />
              )}
            </View>

            <View style={styles.dateActionRow}>
              <TouchableOpacity
                style={[styles.dateActionButton, styles.dateCancelButton]}
                onPress={handleCancelDate}
              >
                <ThemedText style={styles.dateCancelThemedThemedText}>ยกเลิก</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateActionButton, styles.dateConfirmButton]}
                onPress={handleConfirmDate}
              >
                <ThemedText style={styles.dateConfirmThemedThemedText}>ตกลง</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGenderModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderModal(false)}>
          <Pressable style={styles.genderModalCard} onPress={() => {}}>
            <ThemedText style={styles.genderModalTitle}>เลือกเพศ</ThemedText>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => {
                setGender("ชาย");
                setShowGenderModal(false);
              }}
            >
              <ThemedText style={styles.genderOptionThemedThemedText}>ชาย</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => {
                setGender("หญิง");
                setShowGenderModal(false);
              }}
            >
              <ThemedText style={styles.genderOptionThemedThemedText}>หญิง</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => {
                setGender("อื่นๆ");
                setShowGenderModal(false);
              }}
            >
              <ThemedText style={styles.genderOptionThemedThemedText}>อื่นๆ</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderCancelButton}
              onPress={() => setShowGenderModal(false)}
            >
              <ThemedText style={styles.genderCancelThemedThemedText}>ยกเลิก</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const ORANGE = "#F5A400";
const BG = "#F1F1F1";
const CARD = "#F6F6F6";
const BORDER = "#222";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerBarThemedThemedText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  homeBackButton: {
    position: "absolute",
    left: 10,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  homeBackThemedThemedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },
  progressTrack: {
    marginTop: 10,
    width: "100%",
    height: 7,
    backgroundColor: "#D7CFBF",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    width: "12%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 999,
  },
  formCard: {
    marginTop: 12,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: BORDER,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginBottom: 6,
    marginTop: 4,
  },
  fullInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  birthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  birthInputButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  birthInputThemedThemedText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderThemedThemedText: {
    color: "#8A8A8A",
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  genderBox: {
    width: "62%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  genderThemedThemedText: {
    fontSize: 16,
    color: "#333",
  },
  spacer: {
    height: 18,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#333",
  },
  eyeButton: {
    paddingHorizontal: 6,
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: "#FFB300",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },
  nextButtonThemedThemedText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  dateModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },
  dateModalHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },
  datePickerWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    backgroundColor: "#fff",
  },
  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  dateActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCancelButton: {
    backgroundColor: "#EFEFEF",
  },
  dateConfirmButton: {
    backgroundColor: ORANGE,
  },
  dateCancelThemedThemedText: {
    color: "#444",
    fontSize: 16,
    fontWeight: "800",
  },
  dateConfirmThemedThemedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  genderModalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 80,
    padding: 16,
  },
  genderModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
    color: "#111",
  },
  genderOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  genderOptionThemedThemedText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  genderCancelButton: {
    marginTop: 12,
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  genderCancelThemedThemedText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
});