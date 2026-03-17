import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
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

// ดึง CSS และค่า Config ต่างๆ มาจากไฟล์ Styles 
import styles, { 
  ORANGE, 
  MIN_CM,
  MAX_CM,
  ITEM_HEIGHT,
  RULER_WIDTH,
  DEFAULT_HEIGHT_CM,
  HEIGHT_DATA
} from "./step2.styles";

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