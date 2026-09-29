import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "../components/themed-text";
import { loginUser } from "../services/auth";
import styles, { ORANGE } from "../style/login.styles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setLoginError("");
  };

  const handleLogin = async () => {
    clearErrors();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    let hasError = false;

    if (!trimmedEmail) {
      setEmailError("กรุณากรอกอีเมล");
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
        hasError = true;
      }
    }

    if (!trimmedPassword) {
      setPasswordError("กรุณากรอกรหัสผ่าน");
      hasError = true;
    }

    if (hasError) return;

    try {
      setSubmitting(true);
      const res = await loginUser(trimmedEmail, trimmedPassword);

      if (!res?.user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้จากระบบ");
      }

      await AsyncStorage.setItem("currentUser", JSON.stringify(res.user));
      if (res.user?.user_id) {
        await AsyncStorage.setItem("user_id", String(res.user.user_id));
      }

      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      const msg = error?.message || "กรุณาลองใหม่";
      if (msg.includes("ไม่พบบัญชี")) {
        setLoginError("ไม่พบบัญชีผู้ใช้นี้ในระบบ");
      } else if (msg.includes("รหัสผ่านไม่ถูกต้อง")) {
        setLoginError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
      } else {
        setLoginError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* --- Hero Section --- */}
          <View style={styles.heroSection}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons name="nutrition" size={22} color="#fff" />
              </View>
              <ThemedText style={styles.brandName}>NutriPlan</ThemedText>
            </View>
            <ThemedText style={styles.heroTitle}>
              ดูแลสุขภาพ{"\n"}เริ่มต้นที่มื้ออาหาร
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              วางแผนมื้ออาหาร ติดตามสารอาหาร{"\n"}และดูแลสุขภาพของคุณอย่างง่ายดาย
            </ThemedText>
          </View>

          {/* --- Login Card --- */}
          <View style={styles.content}>
            <View style={styles.card}>
              {loginError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color="#E53935" />
                  <ThemedText style={styles.errorBannerText}>{loginError}</ThemedText>
                </View>
              ) : null}

              <ThemedText style={styles.label}>อีเมล</ThemedText>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(""); setLoginError(""); }}
                placeholder="กรอกอีเมล"
                placeholderTextColor="#BBB"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? <ThemedText style={styles.errorText}>{emailError}</ThemedText> : null}

              <ThemedText style={styles.label}>รหัสผ่าน</ThemedText>
              <View style={[styles.passwordWrap, passwordError ? styles.passwordWrapError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(""); setLoginError(""); }}
                  placeholder="กรอกรหัสผ่าน"
                  placeholderTextColor="#BBB"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#999" />
                </TouchableOpacity>
              </View>
              {passwordError ? <ThemedText style={styles.errorText}>{passwordError}</ThemedText> : null}

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={submitting} activeOpacity={0.85}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>เข้าสู่ระบบ</ThemedText>
                )}
              </TouchableOpacity>

              {/* --- Social Login --- */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.registerLink} onPress={() => router.push("/register/step1")}>
                <ThemedText style={styles.registerLinkText}>ยังไม่มีบัญชี? สมัครสมาชิก</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
