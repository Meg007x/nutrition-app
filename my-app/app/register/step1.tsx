import React, { useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../../components/themed-text";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRegister } from "../../context/register-context";
import type { Gender } from "../../types/register-types";
import styles from "./step1.styles";

export default function RegisterStep1Screen() {
  const router = useRouter();
  const { form, updateForm } = useRegister();

  const [username, setUsername] = useState(form.username || form.name || "");
  const [email, setEmail] = useState(form.email || "");

  const [birthDate, setBirthDate] = useState<Date | null>(
    form.dateOfBirth ? new Date(form.dateOfBirth) : null
  );

  const [tempBirthDate, setTempBirthDate] = useState<Date>(
    form.dateOfBirth
      ? new Date(form.dateOfBirth)
      : new Date(2004, 4, 14)
  );

  const [gender, setGender] = useState<Gender>(form.gender || "");
  const [password, setPassword] = useState(form.password || "");
  const [confirmPassword, setConfirmPassword] = useState(
    form.confirmPassword || ""
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePickerIOS, setShowDatePickerIOS] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [debugMessage, setDebugMessage] = useState("");

  // =========================================================
  // แสดงวันเกิดในรูปแบบภาษาไทย
  // =========================================================
  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return "";

    const day = birthDate.getDate();
    const month = birthDate.toLocaleString("th-TH", {
      month: "long",
    });
    const year = birthDate.getFullYear();

    return `${day} ${month} ${year}`;
  }, [birthDate]);

  // =========================================================
  // แปลง Date -> YYYY-MM-DD สำหรับ Web input type="date"
  // =========================================================
  const formatDateForWeb = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // แปลง YYYY-MM-DD -> Date
  // ใช้สำหรับ Web
  // =========================================================
  const parseWebDate = (value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  // =========================================================
  // เปิดปฏิทิน
  // =========================================================
  const openDateModal = () => {
    const currentDate = birthDate || new Date(2004, 4, 14);

    setTempBirthDate(currentDate);

    if (Platform.OS === "web") {
      return;
    }

    if (Platform.OS === "ios") {
      setShowDateModal(true);
      setShowDatePickerIOS(true);
    } else {
      setShowDateModal(true);
    }
  };

  // =========================================================
  // เปลี่ยนวันที่ของ Android / iOS
  // =========================================================
  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
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

  // =========================================================
  // เปลี่ยนวันที่บน Web
  // =========================================================
  const handleWebDateChange = (value: string) => {
    if (!value) return;

    const selectedDate = parseWebDate(value);
    setBirthDate(selectedDate);
    setTempBirthDate(selectedDate);
  };

  // =========================================================
  // ยืนยันวันเกิด
  // =========================================================
  const handleConfirmDate = () => {
    setBirthDate(tempBirthDate);
    setShowDateModal(false);
    setShowDatePickerIOS(false);
  };

  // =========================================================
  // ยกเลิกเลือกวันเกิด
  // =========================================================
  const handleCancelDate = () => {
    setShowDateModal(false);
    setShowDatePickerIOS(false);
  };

  // =========================================================
  // คำนวณอายุจากวันเกิด
  // =========================================================
  const calculateAgeFromBirthDate = (date: Date) => {
    const today = new Date();

    let age = today.getFullYear() - date.getFullYear();

    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    return String(age);
  };

  // =========================================================
  // กดถัดไป
  // =========================================================
  const handleNext = () => {
    setErrorMessage("");
    setDebugMessage("กดปุ่มแล้ว");

    if (
      !username.trim() ||
      !email.trim() ||
      !birthDate ||
      !gender ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      setDebugMessage("ไม่ผ่าน: ข้อมูลไม่ครบ");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      setDebugMessage("ไม่ผ่าน: อีเมลไม่ถูกต้อง");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร");
      setDebugMessage("ไม่ผ่าน: รหัสผ่านสั้น");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("กรุณาตรวจสอบรหัสผ่านอีกครั้ง");
      setDebugMessage("ไม่ผ่าน: รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      updateForm({
        username: username.trim(),
        name: username.trim(),
        email: trimmedEmail,
        password,
        confirmPassword,
        dateOfBirth: birthDate.toISOString(),
        age: calculateAgeFromBirthDate(birthDate),
        gender,
      });

      setDebugMessage("ผ่าน validation แล้ว กำลังไป step2");

      router.replace("/register/step2");
    } catch (error) {
      console.error("step1 handleNext error:", error);

      setErrorMessage("เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล");
      setDebugMessage(`error: ${String(error)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* =====================================================
          HEADER
      ===================================================== */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.homeBackButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="arrow-back" size={16} color="#fff" />

          <ThemedText style={styles.homeBackThemedThemedText}>
            หน้าแรก
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerBarThemedThemedText}>
          ลงทะเบียนผู้ใช้งาน
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================
            STEP TITLE
        ===================================================== */}
        <ThemedText style={styles.stepTitle}>
          1.ข้อมูลพื้นฐาน
        </ThemedText>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <ThemedText style={styles.debugText}>
          {debugMessage}
        </ThemedText>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>
              {errorMessage}
            </ThemedText>
          </View>
        )}

        {/* =====================================================
            FORM
        ===================================================== */}
        <View style={styles.formCard}>
          {/* ชื่อผู้ใช้ */}
          <ThemedText style={styles.label}>
            ชื่อผู้ใช้
          </ThemedText>

          <TextInput
            style={styles.fullInput}
            value={username}
            onChangeText={setUsername}
            placeholder="กรอกชื่อผู้ใช้"
            placeholderTextColor="#8A8A8A"
          />

          {/* อีเมล */}
          <ThemedText style={styles.label}>
            อีเมล
          </ThemedText>

          <TextInput
            style={styles.fullInput}
            value={email}
            onChangeText={setEmail}
            placeholder="กรอกอีเมล"
            placeholderTextColor="#8A8A8A"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* =================================================
              วันเกิด
          ================================================= */}
          <ThemedText style={styles.label}>
            วันเกิด
          </ThemedText>

          {Platform.OS === "web" ? (
            // =================================================
            // WEB DATE PICKER
            // =================================================
            <View style={styles.birthRow}>
              <View style={styles.birthInputButton}>
                <input
                  type="date"
                  value={
                    birthDate
                      ? formatDateForWeb(birthDate)
                      : ""
                  }
                  onChange={(event) =>
                    handleWebDateChange(event.target.value)
                  }
                  max={formatDateForWeb(new Date())}
                  style={{
                    width: "100%",
                    height: 44,
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    fontSize: 16,
                    color: "#333",
                    fontFamily: "NotoSansThai",
                    cursor: "pointer",
                  }}
                />
              </View>
            </View>
          ) : (
            // =================================================
            // ANDROID / IOS
            // =================================================
            <View style={styles.birthRow}>
              <Pressable
                style={styles.birthInputButton}
                onPress={openDateModal}
              >
                <ThemedText
                  style={[
                    styles.birthInputThemedThemedText,
                    !formattedBirthDate &&
                      styles.placeholderThemedThemedText,
                  ]}
                >
                  {formattedBirthDate ||
                    "เลือกวัน / เดือน / ปี"}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* เพศ */}
          <ThemedText style={styles.label}>
            เพศ
          </ThemedText>

          <TouchableOpacity
            style={styles.genderBox}
            onPress={() => setShowGenderModal(true)}
          >
            <ThemedText
              style={[
                styles.genderThemedThemedText,
                !gender &&
                  styles.placeholderThemedThemedText,
              ]}
            >
              {gender || "เลือกเพศ"}
            </ThemedText>

            <Ionicons
              name="chevron-down"
              size={20}
              color="#777"
            />
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* รหัสผ่าน */}
          <ThemedText style={styles.label}>
            รหัสผ่าน
          </ThemedText>

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
              onPress={() =>
                setShowPassword(!showPassword)
              }
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-outline"
                    : "eye-off-outline"
                }
                size={22}
                color="#444"
              />
            </TouchableOpacity>
          </View>

          {/* ยืนยันรหัสผ่าน */}
          <ThemedText style={styles.label}>
            ยืนยันรหัสผ่าน
          </ThemedText>

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
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-outline"
                    : "eye-off-outline"
                }
                size={22}
                color="#444"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* =====================================================
            NEXT BUTTON
        ===================================================== */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <ThemedText
            style={styles.nextButtonThemedThemedText}
          >
            ถัดไป
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* =======================================================
          DATE MODAL
          ใช้เฉพาะ Android / iOS
      ======================================================= */}
      {Platform.OS !== "web" && (
        <Modal
          visible={showDateModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <ThemedText style={styles.dateModalTitle}>
                  เลือกวันเกิด
                </ThemedText>
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
                    style={{
                      backgroundColor: "#fff",
                    }}
                  />
                )}
              </View>

              <View style={styles.dateActionRow}>
                <TouchableOpacity
                  style={[
                    styles.dateActionButton,
                    styles.dateCancelButton,
                  ]}
                  onPress={handleCancelDate}
                >
                  <ThemedText
                    style={
                      styles.dateCancelThemedThemedText
                    }
                  >
                    ยกเลิก
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateActionButton,
                    styles.dateConfirmButton,
                  ]}
                  onPress={handleConfirmDate}
                >
                  <ThemedText
                    style={
                      styles.dateConfirmThemedThemedText
                    }
                  >
                    ตกลง
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* =======================================================
          GENDER MODAL
      ======================================================= */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGenderModal(false)}
        >
          <Pressable
            style={styles.genderModalCard}
            onPress={() => {}}
          >
            <ThemedText style={styles.genderModalTitle}>
              เลือกเพศ
            </ThemedText>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => {
                setGender("ชาย");
                setShowGenderModal(false);
              }}
            >
              <ThemedText
                style={
                  styles.genderOptionThemedThemedText
                }
              >
                ชาย
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => {
                setGender("หญิง");
                setShowGenderModal(false);
              }}
            >
              <ThemedText
                style={
                  styles.genderOptionThemedThemedText
                }
              >
                หญิง
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderCancelButton}
              onPress={() => setShowGenderModal(false)}
            >
              <ThemedText
                style={
                  styles.genderCancelThemedThemedText
                }
              >
                ยกเลิก
              </ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}