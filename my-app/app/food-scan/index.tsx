import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

const ORANGE = "#F28A1A";
const LIGHT_ORANGE = "#F28A1A";
const BG = "#F4F4F4";
const WHITE = "#FFFFFF";
const BLUE = "#3F66D6";
const RED = "#B90000";
const BORDER = "#222";

export default function ScanFoodScreen() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { date, mealType, returnTo } = useLocalSearchParams<{
    date?: string;
    mealType?: string;
    returnTo?: string;
  }>();

  const handleBack = () => {
    // 🔧 บังคับกลับ Dashboard เสมอ ไม่ใช้ router.back() เพราะอาจเด้งกลับหน้า Login
    router.replace("/(tabs)/dashboard");
  };

  const requestCameraPermission = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("ต้องการสิทธิ์กล้อง", "กรุณาอนุญาตการใช้กล้องก่อน");
      return false;
    }
    return true;
  };

  const requestMediaPermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("ต้องการสิทธิ์คลังรูป", "กรุณาอนุญาตการเข้าถึงรูปภาพก่อน");
      return false;
    }
    return true;
  };

  const goToResult = (uri: string) => {
    router.push({
      pathname: "/food-scan/result",
      params: {
        imageUri: uri,
        ...(date ? { date: String(date) } : {}),
        ...(mealType ? { mealType: String(mealType) } : {}),
        ...(returnTo ? { returnTo: String(returnTo) } : {}),
      },
    });
  };

  const handleTakePhoto = async () => {
    try {
      setBusy(true);
      const granted = await requestCameraPermission();
      if (!granted) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setPreviewImage(uri);
        goToResult(uri);
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเปิดกล้องได้");
    } finally {
      setBusy(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setBusy(true);
      const granted = await requestMediaPermission();
      if (!granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setPreviewImage(uri);
        goToResult(uri);
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกรูปภาพได้");
    } finally {
      setBusy(false);
    }
  };

  const handleScan = () => {
    if (!previewImage) {
      Alert.alert("ยังไม่มีรูป", "กรุณาถ่ายรูปหรือเลือกรูปก่อน");
      return;
    }
    goToResult(previewImage);
  };

  const handleManualEntry = () => {
    router.push({
      pathname: "/food/manual",
      params: {
        ...(date ? { date: String(date) } : {}),
        ...(mealType ? { mealType: String(mealType) } : {}),
        ...(returnTo ? { returnTo: String(returnTo) } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={32} color="#111" />
            </TouchableOpacity>

            <Text style={styles.title}>สแกนอาหาร</Text>
          </View>

          <Text style={styles.subtitle}>
            โปรดแน่ใจว่าส่วนที่มีแสงสว่างมากพอและภาพ{"\n"}
            อาหารอยู่ภายในกรอบ
          </Text>
        </View>

        <View style={styles.previewSection}>
          <View style={styles.frameWrap}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={54} color="#999" />
                <Text style={styles.placeholderText}>ยังไม่ได้เลือกรูปอาหาร</Text>
              </View>
            )}

            <View pointerEvents="none" style={styles.cornerTL} />
            <View pointerEvents="none" style={styles.cornerTR} />
            <View pointerEvents="none" style={styles.cornerBL} />
            <View pointerEvents="none" style={styles.cornerBR} />
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionSpacer} />

          <TouchableOpacity
            style={styles.captureButtonOuter}
            onPress={handleTakePhoto}
            activeOpacity={0.85}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickImage}
            activeOpacity={0.7}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={BLUE} />
            ) : (
              <Ionicons name="image-outline" size={40} color={BLUE} />
            )}
          </TouchableOpacity>
        </View>

        {previewImage ? (
          <TouchableOpacity
            style={[styles.scanButton, busy && styles.scanButtonDisabled]}
            onPress={handleScan}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Text style={styles.scanButtonText}>วิเคราะห์รูปภาพ</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualEntry}
          activeOpacity={0.8}
          disabled={busy}
        >
          <Ionicons name="pencil-sharp" size={22} color={WHITE} />
          <Text style={styles.manualButtonText}>บันทึกด้วยตัวเอง</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 30;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
    marginRight: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    lineHeight: 34,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    fontWeight: "500",
  },

  previewSection: {
    marginTop: 30,
    alignItems: "center",
  },

  frameWrap: {
    width: width * 0.88,
    aspectRatio: 1.1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "94%",
    height: "85%",
    borderRadius: 20,
    resizeMode: "cover",
  },

  placeholderBox: {
    width: "94%",
    height: "85%",
    borderRadius: 20,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },

  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderTopLeftRadius: 12,
  },

  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderTopRightRadius: 12,
  },

  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderBottomLeftRadius: 12,
  },

  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderBottomRightRadius: 12,
  },

  actionRow: {
    marginTop: 30,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  actionSpacer: {
    width: 60,
  },

  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: WHITE,
  },

  galleryButton: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  scanButton: {
    marginTop: 30,
    alignSelf: "center",
    width: "85%",
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 8,
  },

  scanButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
  },

  scanButtonText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "900",
  },

  manualButton: {
    marginTop: 28,
    alignSelf: "center",
    width: "85%",
    backgroundColor: LIGHT_ORANGE,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  manualButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "800",
  },
});