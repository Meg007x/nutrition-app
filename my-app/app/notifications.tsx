import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ กลับ</Text>
        </Pressable>

        <Text style={styles.title}>แจ้งเตือน</Text>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ตัวอย่างแจ้งเตือน</Text>
          <Text style={styles.cardBody}>
            ตอนนี้ยังเป็นตัวอย่าง — ขั้นต่อไปค่อยดึงจาก backend/collection NotificationSettings
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
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { color: "#2e7d32", fontWeight: "900" },
  title: { fontSize: 18, fontWeight: "900" },

  body: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },
  cardTitle: { fontWeight: "900", fontSize: 16 },
  cardBody: { marginTop: 6, color: "#555", fontWeight: "600" },
});