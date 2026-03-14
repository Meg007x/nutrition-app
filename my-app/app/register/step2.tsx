import React, { useMemo, useRef, useState } from "react";
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ORANGE = "#F5A400";
const ORANGE_DK = "#C97D00";
const BG = "#F1F1F1";
const RULER_BG = "#EDE0CC";
const WHITE = "#FFFFFF";

// ─── Ruler Config ─────────────────────────────────────────────────────────────
const MIN_CM = 100;
const MAX_CM = 220;
const ITEM_HEIGHT = 13;
const RULER_WIDTH = 110;
const DEFAULT_HEIGHT_CM = 171;

const HEIGHT_DATA = Array.from(
  { length: MAX_CM - MIN_CM + 1 },
  (_, i) => MAX_CM - i
);

export default function RegisterStep2Screen() {
  const { form, updateForm } = useRegister();

  const initialHeight = form.heightCm ? Number(form.heightCm) : DEFAULT_HEIGHT_CM;

  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const flatListRef = useRef<FlatList<number>>(null);
  const hasInitializedRef = useRef(false);

  const currentIndex = useMemo(() => MAX_CM - heightCm, [heightCm]);

  const [rulerHeight, setRulerHeight] = useState(400);
  const centerPad = rulerHeight / 2 - ITEM_HEIGHT / 2;

  const displayValue = useMemo(() => {
    if (unit === "cm") return `${heightCm}`;

    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }, [heightCm, unit]);

  const updateHeightFromOffset = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, HEIGHT_DATA.length - 1));
    const nextHeight = HEIGHT_DATA[clamped];

    setHeightCm((prev) => (prev === nextHeight ? prev : nextHeight));
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    updateHeightFromOffset(offsetY);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    updateHeightFromOffset(offsetY);
  };

  const handleRulerLayout = (height: number) => {
    setRulerHeight(height);

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: currentIndex * ITEM_HEIGHT,
          animated: false,
        });
      });
    }
  };

  const handleNext = () => {
    updateForm({
      heightCm: String(heightCm),
    });

    router.push("/register/step3");
  };

  const renderRulerItem = ({ item }: { item: number }) => {
    const isMajor = item % 10 === 0;
    const isMedium = item % 5 === 0 && !isMajor;

    return (
      <View style={styles.rulerRow}>
        {isMajor ? (
          <Text style={styles.rulerLabelMajor}>{item}</Text>
        ) : (
          <View style={styles.rulerLabelSpacer} />
        )}

        <View
          style={[
            styles.tick,
            isMajor && styles.tickMajor,
            isMedium && styles.tickMedium,
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

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.stepTitle}>2.ส่วนสูง</Text>
          <TouchableOpacity
            style={styles.helpRow}
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#111" />
            <Text style={styles.helpText}>วัดยังไงให้แม่นยำ?</Text>
            <Ionicons name="chevron-forward" size={18} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.questionTitle}>ส่วนสูงของคุณคือเท่าไหร่ ?</Text>
        <Text style={styles.questionDesc}>
          ส่วนสูงของคุณจะช่วยให้สามารถปรับ{"\n"}แต่งแผนการกินได้อย่างแม่นยำ
        </Text>

        <View style={styles.unitToggleWrap}>
          {(["cm", "ft"] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitButton, unit === u && styles.unitButtonActive]}
              onPress={() => setUnit(u)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.unitText, unit === u && styles.unitTextActive]}
              >
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.displayArea}>
          <View style={styles.leftZone} pointerEvents="box-none">
            <View style={styles.valueBlock}>
              <Text style={styles.bigValue}>{displayValue}</Text>
              <Text style={styles.bigUnit}>{unit}</Text>
            </View>
          </View>

          <View style={styles.selectionLine} pointerEvents="none">
            <View style={styles.lineArrow} />
          </View>

          <View
            style={styles.rulerContainer}
            onLayout={(e) => handleRulerLayout(e.nativeEvent.layout.height)}
          >
            <View
              style={[styles.rulerFade, styles.rulerFadeTop]}
              pointerEvents="none"
            />

            <FlatList
              ref={flatListRef}
              data={HEIGHT_DATA}
              keyExtractor={(item) => item.toString()}
              renderItem={renderRulerItem}
              style={styles.rulerList}
              scrollEnabled
              nestedScrollEnabled
              showsVerticalScrollIndicator
              scrollEventThrottle={16}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              bounces={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              contentContainerStyle={{
                paddingTop: centerPad,
                paddingBottom: centerPad,
              }}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
            />

            <View
              style={[styles.rulerFade, styles.rulerFadeBottom]}
              pointerEvents="none"
            />

            <View style={styles.rulerBorder} pointerEvents="none" />
          </View>
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
            <Text style={styles.modalTitle}>วิธีวัดส่วนสูงให้แม่นยำ</Text>
            <Text style={styles.modalBody}>
              1. ถอดรองเท้า{"\n"}
              2. ยืนหลังตรง ชิดกำแพง{"\n"}
              3. มองตรงไปด้านหน้า{"\n"}
              4. ใช้ไม้บรรทัดหรือสายวัดวัดจากพื้นถึงศีรษะ
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBarText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  helpText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#D4C9B5",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressFill: {
    width: "18%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 999,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
  },
  questionDesc: {
    marginTop: 8,
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 16,
  },
  unitToggleWrap: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#222",
    overflow: "hidden",
    marginBottom: 12,
    borderRadius: 6,
  },
  unitButton: {
    width: 72,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },
  unitButtonActive: {
    backgroundColor: ORANGE,
  },
  unitText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#333",
  },
  unitTextActive: {
    color: WHITE,
  },
  displayArea: {
    flex: 1,
    backgroundColor: WHITE,
    position: "relative",
    overflow: "hidden",
  },
  leftZone: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: "50%",
    right: RULER_WIDTH + 16,
    zIndex: 2,
    justifyContent: "flex-end",
    paddingLeft: 16,
    paddingBottom: 10,
  },
  valueBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bigValue: {
    fontSize: 96,
    lineHeight: 100,
    fontWeight: "900",
    color: "#0A0A0A",
    letterSpacing: -3,
    includeFontPadding: false,
  },
  bigUnit: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "800",
    color: "#0A0A0A",
    marginLeft: 4,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  selectionLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -2,
    height: 4,
    backgroundColor: ORANGE_DK,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  lineArrow: {
    position: "absolute",
    right: RULER_WIDTH - 1,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: ORANGE_DK,
  },
  rulerContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: RULER_WIDTH,
    backgroundColor: RULER_BG,
    zIndex: 4,
  },
  rulerList: {
    flex: 1,
    width: "100%",
  },
  rulerBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  rulerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },
  rulerFadeTop: {
    top: 0,
    backgroundColor: RULER_BG,
    opacity: 0.78,
  },
  rulerFadeBottom: {
    bottom: 0,
    backgroundColor: RULER_BG,
    opacity: 0.78,
  },
  rulerRow: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  rulerLabelMajor: {
    width: 36,
    fontSize: 11,
    fontWeight: "800",
    color: "#333",
    letterSpacing: -0.3,
  },
  rulerLabelSpacer: {
    width: 36,
  },
  tick: {
    height: 1.5,
    width: 12,
    backgroundColor: "#9B8C78",
    marginLeft: "auto",
  },
  tickMedium: {
    width: 20,
    height: 2,
    backgroundColor: "#7A6A58",
  },
  tickMajor: {
    width: 32,
    height: 2.5,
    backgroundColor: "#3A3028",
  },
  bottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C0C0C0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backButtonText: {
    color: "#111",
    fontSize: 17,
    fontWeight: "900",
  },
  nextButton: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    elevation: 4,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  nextButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    color: "#444",
    lineHeight: 26,
  },
  modalCloseButton: {
    marginTop: 18,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCloseText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "900",
  },
});