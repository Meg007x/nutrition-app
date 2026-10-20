import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../../components/themed-text";
import { Brand } from "../../constants/theme";

const ORANGE = Brand.primary;
const FONT_REGULAR = "NotoSansThai";
const FONT_BOLD = "NotoSansThaiBold";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setEmailError("");
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setEmailError("กรุณากรอกอีเมล"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) { setEmailError("รูปแบบอีเมลไม่ถูกต้อง"); return; }
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ backgroundColor: ORANGE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 }}>
            <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={{ color: "#fff", fontSize: 18, fontFamily: FONT_BOLD }}>ลืมรหัสผ่าน</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1, padding: 24, alignItems: "center", paddingTop: 40 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: Brand.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Ionicons name="key-outline" size={48} color={ORANGE} />
            </View>

            <ThemedText style={{ fontSize: 24, fontFamily: FONT_BOLD, color: "#222", marginBottom: 8 }}>กู้คืนรหัสผ่าน</ThemedText>
            <ThemedText style={{ fontSize: 14, fontFamily: FONT_REGULAR, color: "#777", textAlign: "center", lineHeight: 22, marginBottom: 32, paddingHorizontal: 16 }}>
              กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
            </ThemedText>

            {!submitted ? (
              <>
                <ThemedText style={{ fontSize: 14, color: "#666", fontFamily: FONT_BOLD, alignSelf: "flex-start", marginBottom: 6 }}>อีเมล</ThemedText>
                <TextInput
                  style={{ width: "100%", backgroundColor: "#F8F8F8", borderRadius: 12, borderWidth: 1.2, borderColor: emailError ? "#E53935" : "#E0E0E0", paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#222", fontFamily: FONT_REGULAR, marginBottom: 8 }}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                  placeholder="กรอกอีเมลของคุณ"
                  placeholderTextColor="#BBB"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? <ThemedText style={{ color: "#E53935", fontSize: 12, fontFamily: FONT_REGULAR, alignSelf: "flex-start", marginBottom: 8, marginLeft: 4 }}>{emailError}</ThemedText> : null}

                <TouchableOpacity style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, marginTop: 16, gap: 8, shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }} onPress={handleSubmit} activeOpacity={0.85}>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                  <ThemedText style={{ color: "#fff", fontSize: 18, fontFamily: FONT_BOLD }}>ส่งลิงก์กู้คืน</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 }}>
                <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
                <ThemedText style={{ fontSize: 22, fontFamily: FONT_BOLD, color: "#222", marginTop: 16, marginBottom: 12 }}>ส่งลิงก์แล้ว!</ThemedText>
                <ThemedText style={{ fontSize: 15, fontFamily: FONT_REGULAR, color: "#666", textAlign: "center", lineHeight: 24 }}>
                  เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่{"\n"}
                  <ThemedText style={{ fontFamily: FONT_BOLD, color: ORANGE }}>{email}</ThemedText>
                  {"\n\n"}กรุณาตรวจสอบกล่องจดหมายของคุณ
                </ThemedText>
                <TouchableOpacity style={{ marginTop: 32, backgroundColor: "#F0F0F0", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }} onPress={() => router.replace("/login")} activeOpacity={0.85}>
                  <ThemedText style={{ fontSize: 16, fontFamily: FONT_BOLD, color: "#333" }}>กลับไปหน้าเข้าสู่ระบบ</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
