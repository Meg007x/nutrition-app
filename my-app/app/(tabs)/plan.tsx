import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PlanScreen() {
  return (
    <View style={styles.container}>
      <Ionicons
        name="restaurant-outline"
        size={70}
        color="#F29913"
      />

      <Text style={styles.title}>
        แผนการกิน
      </Text>

      <Text style={styles.subtitle}>
        สร้างแผนอาหารที่เหมาะกับเป้าหมายของคุณ
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/create-plan/step1")
        }
      >
        <Ionicons
          name="add"
          size={24}
          color="#fff"
        />

        <Text style={styles.buttonText}>
          สร้างแผนการกิน
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },

  button: {
    marginTop: 30,
    height: 55,
    minWidth: 220,
    paddingHorizontal: 25,
    borderRadius: 12,
    backgroundColor: "#F9A800",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});