import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

export default function WeeklyScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ กลับ</Text>
        </Pressable>

        <Text style={styles.title}>ภาพรวมรายสัปดาห์</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>ผู้ใช้: {userId ?? "-"}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>สรุปสัปดาห์นี้</Text>
          <Text style={styles.cardBody}>
            (ยังไม่ต่อ backend) หน้านี้ไว้แสดงสรุป kcal/macros/น้ำ และวันที่เกินเป้า
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>รายละเอียดรายวัน</Text>
          <Text style={styles.cardBody}>
            ทำเป็นรายการ 7 วัน แล้วกดเข้าไปดูรายละเอียดวันนั้นได้
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { color: "#2e7d32", fontWeight: "900", fontSize: 16 },
  title: { fontSize: 18, fontWeight: "900" },

  body: { padding: 16 },
  subtitle: { color: "#555", marginBottom: 12, fontWeight: "700" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardTitle: { fontWeight: "900", fontSize: 16 },
  cardBody: { marginTop: 6, color: "#666", fontWeight: "600" },
});