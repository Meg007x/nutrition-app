import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedText } from '../components/themed-text'; 


export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <ThemedText style={styles.logoThemedText}>🥗</ThemedText>
        </View>

        <ThemedText style={styles.title}>Nutrition Planning</ThemedText>
        <ThemedText style={styles.subtitle}>
          วางแผนการกิน ดูแลสุขภาพ{"\n"}ง่ายๆ ในคลิกเดียว
        </ThemedText>

        <View style={styles.imageWrapper}>
          <View style={styles.imageCircle}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
              }}
              style={styles.foodImage}
            />
          </View>

          <View style={styles.kcalBadge}>
            <ThemedText style={styles.kcalThemedText}>🔥 350 Kcal</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.bottomCard}>
        <ThemedText style={styles.bottomTitle}>เริ่มต้นสุขภาพดีวันนี้</ThemedText>
        <ThemedText style={styles.bottomSubtitle}>เข้าร่วมกับเราเพื่อสุขภาพที่ดี</ThemedText>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/register/step1")}
        >
          <ThemedText style={styles.primaryButtonThemedText}>สร้างบัญชีใหม่</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <ThemedText style={styles.secondaryButtonThemedText}>เข้าสู่ระบบ</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ORANGE = "#E8921D";
const YELLOW = "#FFB300";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE,
  },
  topSection: {
    flex: 1.1,
    alignItems: "center",
    paddingTop: 26,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  logoThemedText: {
    fontSize: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2A1207",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  imageWrapper: {
    marginTop: 28,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imageCircle: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
  },
  foodImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  kcalBadge: {
    position: "absolute",
    top: 18,
    right: -6,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#111827",
  },
  kcalThemedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  bottomCard: {
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 34,
  },
  bottomTitle: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: "#000",
  },
  bottomSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#7C7C7C",
    marginTop: 18,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: YELLOW,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 4,
  },
  primaryButtonThemedText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#111827",
    elevation: 3,
  },
  secondaryButtonThemedText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
  },
});