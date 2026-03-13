import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    router.replace("/(tabs)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>เข้าสู่ระบบ</Text>
        <Text style={styles.subtitle}>ยินดีต้อนรับกลับมา</Text>

        <Text style={styles.label}>อีเมล</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกอีเมล"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกรหัสผ่าน"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register/step1")}>
          <Text style={styles.linkText}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← กลับหน้าแรก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: "900", color: "#111827" },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, marginBottom: 28 },
  label: { fontSize: 15, fontWeight: "700", marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: "#FFB300",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    color: "#EA580C",
    fontWeight: "700",
  },
  backText: {
    marginTop: 16,
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "700",
  },
});