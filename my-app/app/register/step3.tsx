import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { 
  ORANGE, 
  BG, 
  IOS_GREEN, 
  ROW_COLOR_1, 
  ROW_COLOR_2, 
  WHITE, 
  WARN_COLOR, 
  ERROR_COLOR,
  ITEM_WIDTH // 👈 นำเข้าความกว้างของขีดไม้บรรทัดมาด้วย
} from "./step3.styles";


const MIN_KG = 30;
const MAX_KG = 150;

const DEFAULT_WEIGHT_KG = 66.0;

const WEIGHT_DATA = Array.from(
  { length: (MAX_KG - MIN_KG) * 10 + 1 },
  (_, i) => Number((MIN_KG + i * 0.1).toFixed(1))
);

export default function RegisterStep3Screen() {
  const { form, updateForm } = useRegister();

  const initialWeight = form.weightKg ? Number(form.weightKg) : DEFAULT_WEIGHT_KG;
  const heightCm = form.heightCm ? Number(form.heightCm) : 171;

  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [weightKg, setWeightKg] = useState(initialWeight);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rulerWidth, setRulerWidth] = useState(0);

  const flatListRef = useRef<FlatList<number>>(null);
  const hasInitializedRef = useRef(false);

  const selectedIndex = useMemo(() => {
    return Math.max(
      0,
      Math.min(WEIGHT_DATA.length - 1, Math.round((weightKg - MIN_KG) * 10))
    );
  }, [weightKg]);

  const centerPadding = useMemo(() => {
    if (!rulerWidth) return 0;
    return rulerWidth / 2 - ITEM_WIDTH / 2;
  }, [rulerWidth]);

  const displayValue = useMemo(() => {
    if (unit === "kg") return weightKg.toFixed(1);
    const lbs = weightKg * 2.20462;
    return lbs.toFixed(1);
  }, [weightKg, unit]);

  const bmi = useMemo(() => {
    if (!heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  }, [weightKg, heightCm]);

  const bmiStatus = useMemo(() => {
    if (bmi < 18.5) {
      return { text: "น้ำหนักน้อย", color: "#4A90E2" };
    }
    if (bmi < 23) {
      return { text: "ปกติ", color: "#62FF00" };
    }
    if (bmi < 25) {
      return { text: "น้ำหนักเกิน", color: "#F5A400" };
    }
    return { text: "อ้วน", color: "#E74C3C" };
  }, [bmi]);

  const bmiMessage = useMemo(() => {
    if (bmi < 18.5) {
      return "ลองเพิ่มพลังงานและโปรตีนเพื่อช่วยให้ร่างกายแข็งแรงขึ้น";
    }
    if (bmi < 23) {
      return "น่าประทับใจมาก มารักษาสุขภาพที่ยอดเยี่ยมด้วยกันเถอะ!";
    }
    if (bmi < 25) {
      return "เริ่มควบคุมอาหารและการออกกำลังกายอีกนิดเพื่อสมดุลที่ดี";
    }
    return "ลองปรับพฤติกรรมการกินและการออกกำลังเพื่อสุขภาพที่ดีขึ้น";
  }, [bmi]);

  const updateWeightFromOffset = (offsetX: number) => {
    const index = Math.round(offsetX / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(index, WEIGHT_DATA.length - 1));
    const selectedWeight = WEIGHT_DATA[clampedIndex];

    setWeightKg((prev) => (prev === selectedWeight ? prev : selectedWeight));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    updateWeightFromOffset(offsetX);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    updateWeightFromOffset(offsetX);
  };

  useEffect(() => {
    if (!rulerWidth || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_WIDTH,
        animated: false,
      });
    });
  }, [rulerWidth, selectedIndex]);

  const handleNext = () => {
    updateForm({
      weightKg: weightKg.toFixed(1),
      bmi,
    });

    router.push("/register/step4");
  };

  const renderRulerItem = ({ index }: { item: number; index: number }) => {
    const value = Number((MIN_KG + index * 0.1).toFixed(1));
    const isMajor = Number.isInteger(value);
    const isMedium = !isMajor && Math.round(value * 10) % 5 === 0;

    return (
      <View style={styles.rulerItem}>
        {isMajor ? (
          <Text style={styles.rulerLabel}>{value}</Text>
        ) : (
          <View style={styles.labelSpacer} />
        )}

        <View
          style={[
            styles.tick,
            isMajor && styles.tickMajor,
            !isMajor && isMedium && styles.tickMedium,
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.stepTitle}>3.น้ำหนัก</Text>

          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#111" />
            <Text style={styles.helpText}>ชั่งยังไงให้แม่นยำ?</Text>
            <Ionicons name="chevron-forward" size={16} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <View style={styles.textCenter}>
          <Text style={styles.questionTitle}>น้ำหนักของคุณคือเท่าไหร่ ?</Text>
          <Text style={styles.questionDesc}>
            น้ำหนักของคุณจะช่วยให้สามารถปรับแต่งแผนการกินได้อย่างแม่นยำ
          </Text>
        </View>

        <View style={styles.unitToggleWrap}>
          <TouchableOpacity
            style={[styles.unitButton, unit === "kg" && styles.unitButtonActive]}
            onPress={() => setUnit("kg")}
            activeOpacity={0.8}
          >
            <Text style={[styles.unitText, unit === "kg" && styles.unitTextActive]}>
              kg
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.unitButton, unit === "lbs" && styles.unitButtonActive]}
            onPress={() => setUnit("lbs")}
            activeOpacity={0.8}
          >
            <Text style={[styles.unitText, unit === "lbs" && styles.unitTextActive]}>
              lbs
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.valueSection}>
          <Text style={styles.bigValue}>{displayValue}</Text>
          <Text style={styles.bigUnit}>{unit}</Text>
        </View>

        <View
          style={styles.rulerSection}
          onLayout={(e) => setRulerWidth(e.nativeEvent.layout.width)}
        >
          <View pointerEvents="none" style={styles.centerLine} />

          <FlatList
            ref={flatListRef}
            horizontal
            data={WEIGHT_DATA}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={renderRulerItem}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            bounces={false}
            overScrollMode="never"
            contentContainerStyle={{
              paddingLeft: centerPadding,
              paddingRight: centerPadding,
            }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
          />
        </View>

        <View style={styles.bmiCard}>
          <View style={styles.bmiTopRow}>
            <Text style={styles.bmiTitle}>BMI ของคุณ</Text>
            <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>
              ({bmiStatus.text})
            </Text>
          </View>

          <View style={styles.bmiContentRow}>
            <Text style={[styles.bmiValue, { color: bmiStatus.color }]}>{bmi}</Text>
            <Text style={styles.bmiMessage}>{bmiMessage}</Text>
          </View>

          <Text style={styles.heightHint}>คำนวณจากส่วนสูง {heightCm} ซม.</Text>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showInfoModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowInfoModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>วิธีชั่งน้ำหนักให้แม่นยำ</Text>
            <Text style={styles.modalBody}>
              1. ชั่งตอนเช้าหลังเข้าห้องน้ำ{"\n"}
              2. ก่อนรับประทานอาหาร{"\n"}
              3. ใช้เครื่องชั่งเดิมทุกครั้ง{"\n"}
              4. วางเครื่องชั่งบนพื้นเรียบแข็ง
            </Text>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>เข้าใจแล้ว</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

