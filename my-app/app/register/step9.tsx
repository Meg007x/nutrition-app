import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function RegisterStep9Screen() {
  const handleFinish = () => {
    Alert.alert("สำเร็จ", "ตอนนี้เป็นโครง navigation ครบแล้ว");
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Step 9</Text>
        <Text style={styles.subtitle}>หน้าตั้งค่ามื้ออาหาร</Text>

        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>สมัครสมาชิกให้เสร็จ</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← ย้อนกลับ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8 },
  button: {
    marginTop: 20,
    backgroundColor: "#FFB300",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  backText: { marginTop: 16, color: "#666", fontWeight: "700" },
});