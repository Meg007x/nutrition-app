import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "../components/themed-text";
import { loginUser } from "../services/auth";
import styles, { 
  ORANGE, 
  BG, 
  CARD, 
  BORDER 
} from "./login.styles";



export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    try {
      setSubmitting(true);

      const res = await loginUser(trimmedEmail, trimmedPassword);
      console.log("เข้าสู่ระบบสำเร็จ:", res);

      if (!res?.user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้จากระบบ");
      }

      await AsyncStorage.setItem("currentUser", JSON.stringify(res.user));

      Alert.alert("สำเร็จ", "เข้าสู่ระบบสำเร็จ");
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error?.message || "กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerBar}>
          <ThemedText style={styles.headerText}>เข้าสู่ระบบ</ThemedText>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <ThemedText style={styles.label}>อีเมล</ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="กรอกอีเมล"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ThemedText style={styles.label}>รหัสผ่าน</ThemedText>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="กรอกรหัสผ่าน"
                placeholderTextColor="#8A8A8A"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
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

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.loginButtonText}>
                  เข้าสู่ระบบ
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push("/register/step1")}
            >
              <ThemedText style={styles.registerLinkText}>
                ยังไม่มีบัญชี? สมัครสมาชิก
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
