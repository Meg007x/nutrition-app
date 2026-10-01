import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const ORANGE = "#F28A1A";
const BG = "#F4F4F4";
const WHITE = "#FFFFFF";
const BLACK = "#111111";
const GRAY = "#6E6E6E";
const BLUE = "#4E86E8";
const CARD_BORDER = "#1F1F1F";

const CARD_HEIGHT = Math.min(220, Math.max(200, height * 0.40));

export default function RecordScreen() {
  const handleOpenFoodScan = () => {
    router.push("/cart");
  };

  const handleOpenWaterLog = () => {
    router.push("/water-log");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar} />

      <View style={styles.headerWrap}>
        <Text style={styles.smallTitle}>เมนูการบันทึกอาหาร</Text>

        <View style={styles.titleRow}>
          <Text style={styles.title}>บันทึกอาหาร</Text>

          <View style={styles.rightHeaderWrap}>
            <View style={styles.streakWrap}>
              <Text style={styles.fire}>🔥</Text>
              <Text style={styles.streakText}>1 วัน</Text>
            </View>

            <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={24} color={BLUE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.card}
          onPress={handleOpenFoodScan}
        >
          <View style={styles.cardInner}>
            <MaterialCommunityIcons name="food" size={84} color={ORANGE} />
            <Text style={styles.cardTitle}>บันทึกมื้ออาหาร</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.card}
          onPress={handleOpenWaterLog}
        >
          <View style={styles.cardInner}>
            <MaterialCommunityIcons name="cup" size={78} color={BLUE} />
            <Text style={styles.cardTitle}>บันทึกน้ำดื่ม</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  topBar: {
    height: 36,
    backgroundColor: ORANGE,
  },

  headerWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  smallTitle: {
    fontSize: 15,
    color: GRAY,
    fontWeight: "700",
    marginBottom: 2,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 23,
    color: BLACK,
    fontWeight: "900",
  },

  rightHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  streakWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },

  fire: {
    fontSize: 24,
    marginRight: 4,
  },

  streakText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "800",
  },

  bellButton: {
    padding: 4,
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: "center",
  },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1.2,
    borderColor: CARD_BORDER,
    borderRadius: 20,
    height: CARD_HEIGHT,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 18,
  },

  cardInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },

  cardTitle: {
    marginTop: 10,
    fontSize: 20,
    color: BLACK,
    fontWeight: "900",
  },
});