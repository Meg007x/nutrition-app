import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import { scheduleMealNotifications } from "../../utils/notificationService";
// นำเข้า styles ทั้งก้อน และนำเข้าสี ORANGE, IOS_GREEN มาใช้กับพวก <Ionicons> หรือ <Switch>
import styles, { ORANGE, IOS_GREEN } from "./step9.styles";


type MealItem = {
  id: string;
  name: string;
  time: string;
  notify: boolean;
};

const DEFAULT_MEALS: MealItem[] = [
  { id: "1", name: "เช้า", time: "08:30", notify: true },
  { id: "2", name: "กลางวัน", time: "12:30", notify: true },
  { id: "3", name: "เย็น", time: "18:30", notify: true },
];
const MIN_MEAL_GAP_MINUTES = 120;
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function normalizeMealsFromForm(mealTimes: any): MealItem[] {
  if (Array.isArray(mealTimes) && mealTimes.length > 0) {
    return mealTimes.map((item: any, index: number) => ({
      id: String(item.id ?? index + 1),
      name: item.name ?? `มื้อที่ ${index + 1}`,
      time: item.time ?? "12:00",
      notify: typeof item.notify === "boolean" ? item.notify : true,
    }));
  }

  if (mealTimes && typeof mealTimes === "object") {
    const mapped: MealItem[] = [];

    if (mealTimes.breakfast) {
      mapped.push({
        id: "1",
        name: "เช้า",
        time: mealTimes.breakfast,
        notify: true,
      });
    }
    if (mealTimes.lunch) {
      mapped.push({
        id: "2",
        name: "กลางวัน",
        time: mealTimes.lunch,
        notify: true,
      });
    }
    if (mealTimes.dinner) {
      mapped.push({
        id: "3",
        name: "เย็น",
        time: mealTimes.dinner,
        notify: true,
      });
    }
    if (mealTimes.snack) {
      mapped.push({
        id: "4",
        name: "ของว่าง",
        time: mealTimes.snack,
        notify: true,
      });
    }

    if (mapped.length > 0) return mapped;
  }

  return DEFAULT_MEALS;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number) {
  const safeMinutes = Math.min(Math.max(totalMinutes, 0), 24 * 60 - 1);
  const hours = Math.floor(safeMinutes / 60).toString().padStart(2, "0");
  const minutes = (safeMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTimePeriod(value: string) {
  if (!isValidTime(value)) return "กรุณากรอกเวลาในรูปแบบ HH:MM";

  const hours = Number(value.slice(0, 2));
  if (hours < 5 || hours >= 19) return "ตอนกลางคืน";
  if (hours < 11) return "ตอนเช้า";
  if (hours < 13) return "ตอนกลางวัน";
  if (hours < 16) return "ตอนบ่าย";
  return "ตอนเย็น";
}

function getMealSpacingViolation(meals: MealItem[]) {
  for (let index = 1; index < meals.length; index += 1) {
    const previousMeal = meals[index - 1];
    const currentMeal = meals[index];

    if (isValidTime(previousMeal.time) && isValidTime(currentMeal.time)) {
      const gapMinutes = timeToMinutes(currentMeal.time) - timeToMinutes(previousMeal.time);
      if (gapMinutes < MIN_MEAL_GAP_MINUTES) {
        return { previousMeal, currentMeal, gapMinutes };
      }
    }
  }

  return null;
}

function getNextMealTime(meal: MealItem | undefined) {
  if (!meal || !isValidTime(meal.time)) return null;

  const nextMinutes = timeToMinutes(meal.time) + MIN_MEAL_GAP_MINUTES;
  if (nextMinutes >= 24 * 60) return null;

  const hours = Math.floor(nextMinutes / 60).toString().padStart(2, "0");
  const minutes = (nextMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function RegisterStep9Screen() {
  const { form, updateForm } = useRegister();

  const initialMeals = useMemo(() => {
    return normalizeMealsFromForm(form.mealTimes);
  }, [form.mealTimes]);

  const [mealCount, setMealCount] = useState(initialMeals.length || 3);
  const [meals, setMeals] = useState<MealItem[]>(initialMeals);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(30);
  const hourScrollRef = useRef<ScrollView | null>(null);
  const minuteScrollRef = useRef<ScrollView | null>(null);
  const pickerAutoScrolled = useRef(false);
  const mealOrderViolation = getMealSpacingViolation(meals);
  const activeMeal = meals.find((meal) => meal.id === activeMealId);
  const activeMealIndex = activeMealId
    ? meals.findIndex((meal) => meal.id === activeMealId)
    : -1;

  const pickerBounds = useMemo(() => {
    if (activeMealIndex < 0) return { min: 0, max: 24 * 60 - 1 };
    const previousMeal = meals[activeMealIndex - 1];
    const nextMeal = meals[activeMealIndex + 1];
    return {
      min: previousMeal && isValidTime(previousMeal.time)
        ? timeToMinutes(previousMeal.time) + MIN_MEAL_GAP_MINUTES
        : 0,
      max: nextMeal && isValidTime(nextMeal.time)
        ? timeToMinutes(nextMeal.time) - MIN_MEAL_GAP_MINUTES
        : 24 * 60 - 1,
    };
  }, [activeMealIndex, meals]);

  const isPickerTimeAllowed = (hour: number, minute: number) => {
    const value = hour * 60 + minute;
    return pickerBounds.min <= pickerBounds.max &&
      value >= pickerBounds.min && value <= pickerBounds.max;
  };

  const getClosestAllowedMinute = (hour: number, preferredMinute: number) => {
    const available = MINUTES.filter((minute) => isPickerTimeAllowed(hour, minute));
    return available.reduce<number | null>((closest, minute) => {
      if (closest === null || Math.abs(minute - preferredMinute) < Math.abs(closest - preferredMinute)) {
        return minute;
      }
      return closest;
    }, null);
  };

  const canSelectMealCount = (count: number) => {
    if (count <= meals.length) return true;
    const lastMeal = meals[meals.length - 1];
    if (!lastMeal || !isValidTime(lastMeal.time)) return false;
    const finalTime = timeToMinutes(lastMeal.time) +
      MIN_MEAL_GAP_MINUTES * (count - meals.length);
    return finalTime < 24 * 60;
  };

  const canAddMeal = meals.length < 6 && Boolean(getNextMealTime(meals[meals.length - 1]));

  useEffect(() => {
    if (!showTimePicker) {
      pickerAutoScrolled.current = false;
      return;
    }
    if (pickerAutoScrolled.current) return;
    pickerAutoScrolled.current = true;
    const timer = setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: pickerHour * 38, animated: false });
      minuteScrollRef.current?.scrollTo({ y: pickerMinute * 38, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [showTimePicker, activeMealId, pickerHour, pickerMinute]);

  const handleSelectCount = (count: number) => {
    setShowDropdown(false);

    let newMeals = [...meals];

    if (count > newMeals.length) {
      for (let i = newMeals.length; i < count; i++) {
        const nextTime = getNextMealTime(newMeals[newMeals.length - 1]);
        if (!nextTime) {
          Alert.alert(
            "ไม่สามารถเพิ่มมื้ออาหารได้",
            "ไม่มีช่วงเวลาเหลือสำหรับเพิ่มมื้อใหม่โดยเว้นห่างอย่างน้อย 2 ชั่วโมง กรุณาปรับเวลามื้อก่อนหน้า"
          );
          return;
        }

        newMeals.push({
          id: `${Date.now()}-${i}`,
          name:
            i === 0 ? "เช้า"
              : i === 1 ? "กลางวัน"
              : i === 2 ? "เย็น"
              : i === 3 ? "ของว่าง"
              : `มื้อที่ ${i + 1}`,
          time: nextTime,
          notify: true,
        });
      }
    } else if (count < newMeals.length) {
      newMeals = newMeals.slice(0, count);
    }

    setMealCount(newMeals.length);
    setMeals(newMeals);
  };

  // 🚀 ฟังก์ชันใหม่: ลบมื้ออาหาร (แบบกดไอคอนถังขยะ)
  const handleRemoveMeal = (idToRemove: string) => {
    if (meals.length <= 1) {
      Alert.alert("ไม่สามารถลบได้", "ต้องมีมื้ออาหารอย่างน้อย 1 มื้อครับ");
      return;
    }
    const updatedMeals = meals.filter((m) => m.id !== idToRemove);
    setMeals(updatedMeals);
    setMealCount(updatedMeals.length);
  };

  // 🚀 ฟังก์ชันใหม่: เพิ่มมื้ออาหาร (แบบกดปุ่มเพิ่มด้านล่าง)
  const handleAddMeal = () => {
    if (meals.length >= 6) {
      Alert.alert("เพิ่มมื้ออาหารไม่ได้", "เพิ่มมื้ออาหารได้สูงสุด 6 มื้อต่อวัน");
      return;
    }

    const nextTime = getNextMealTime(meals[meals.length - 1]);
    if (!nextTime) {
      Alert.alert(
        "ไม่สามารถเพิ่มมื้ออาหารได้",
        "ไม่มีช่วงเวลาเหลือสำหรับเพิ่มมื้อใหม่โดยเว้นห่างอย่างน้อย 2 ชั่วโมง กรุณาปรับเวลามื้อก่อนหน้า"
      );
      return;
    }

    const newMeal: MealItem = {
      id: `${Date.now()}-${meals.length}`,
      name: `มื้อที่ ${meals.length + 1}`,
      time: nextTime,
      notify: true,
    };
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    setMealCount(updatedMeals.length);
  };

  const updateMeal = (
    id: string,
    field: keyof MealItem,
    value: string | boolean
  ) => {
    setMeals((prev) =>
      prev.map((meal) => (meal.id === id ? { ...meal, [field]: value } : meal))
    );
  };

  const openPicker = (id: string) => {
    const index = meals.findIndex((meal) => meal.id === id);
    if (index < 0) return;

    const previousMeal = meals[index - 1];
    const nextMeal = meals[index + 1];
    const min = previousMeal && isValidTime(previousMeal.time)
      ? timeToMinutes(previousMeal.time) + MIN_MEAL_GAP_MINUTES
      : 0;
    const max = nextMeal && isValidTime(nextMeal.time)
      ? timeToMinutes(nextMeal.time) - MIN_MEAL_GAP_MINUTES
      : 24 * 60 - 1;

    setActiveMealId(id);
    if (min <= max) {
      const current = isValidTime(meals[index].time)
        ? timeToMinutes(meals[index].time)
        : min;
      const initial = Math.min(Math.max(current, min), max);
      setPickerHour(Math.floor(initial / 60));
      setPickerMinute(initial % 60);
    }
    setShowTimePicker(true);
  };

  const choosePickerHour = (hour: number) => {
    const closestMinute = getClosestAllowedMinute(hour, pickerMinute);
    if (closestMinute === null) return;
    setPickerHour(hour);
    setPickerMinute(closestMinute);
  };

  const handleFinish = async () => {
    const hasInvalidTime = meals.some((meal) => !isValidTime(meal.time));

    if (hasInvalidTime) {
      Alert.alert(
        "เวลาไม่ถูกต้อง",
        "กรุณาตรวจสอบเวลาของทุกมื้อให้อยู่ในรูปแบบ 24 ชั่วโมง HH:MM เช่น 08:30"
      );
      return;
    }

    const orderViolation = getMealSpacingViolation(meals);
    if (orderViolation) {
      Alert.alert(
        "ระยะห่างเวลาไม่ถูกต้อง",
        `${orderViolation.currentMeal.name} ต้องห่างจาก${orderViolation.previousMeal.name} อย่างน้อย 2 ชั่วโมง`
      );
      return;
    }

    updateForm({
      mealTimes: meals as any,
    });

    const result = await scheduleMealNotifications(meals);

    if (!result.ok && result.reason === "permission_denied") {
      Alert.alert(
        "ยังไม่ได้รับสิทธิ์แจ้งเตือน",
        "ระบบบันทึกเวลามื้ออาหารแล้ว แต่ยังไม่สามารถเปิดการแจ้งเตือนได้ กรุณาอนุญาตการแจ้งเตือนในเครื่อง"
      );
    } else {
      Alert.alert("บันทึกสำเร็จ", "ตั้งเวลาและแจ้งเตือนมื้ออาหารเรียบร้อย");
    }

    router.push("/register/summary" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>8. เวลามื้ออาหาร</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>

        <Text style={styles.subtitle}>จำนวนมื้ออาหารที่รับประทานต่อวัน</Text>
        <Text style={styles.timeHint}>
          ใช้เวลาแบบ 24 ชั่วโมง และเว้นระยะระหว่างมื้ออย่างน้อย 2 ชั่วโมง เช่น 08:30 น. คือช่วงเช้า, 12:30 น. คือช่วงกลางวัน และ 18:30 น. คือช่วงเย็น
        </Text>

        <View style={{ zIndex: 10 }}>
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{mealCount} มื้อ</Text>
            <Ionicons
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={24}
              color="#000"
            />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.dropdownItem,
                    !canSelectMealCount(num) && styles.dropdownItemDisabled,
                  ]}
                  disabled={!canSelectMealCount(num)}
                  onPress={() => handleSelectCount(num)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      !canSelectMealCount(num) && styles.dropdownItemTextDisabled,
                    ]}
                  >
                    {num} มื้อ
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>⏳</Text>
          <Text style={styles.sectionTitle}>เวลามื้ออาหาร</Text>
        </View>

        {mealOrderViolation ? (
          <Text style={styles.timeOrderError}>
            {mealOrderViolation.currentMeal.name} ต้องห่างจาก
            {mealOrderViolation.previousMeal.name} อย่างน้อย 2 ชั่วโมง
          </Text>
        ) : null}

        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {/* 🚀 เพิ่มถังขยะข้างๆ ชื่อมื้ออาหาร */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.cardTitle}>{meal.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveMeal(meal.id)} style={{ marginLeft: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>เปิดการแจ้งเตือนมื้อนี้</Text>
                <Switch
                  trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                  thumbColor="#FFF"
                  onValueChange={(val) => updateMeal(meal.id, "notify", val)}
                  value={meal.notify}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>ชื่อมื้อ</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={meal.name}
                    onChangeText={(text) => updateMeal(meal.id, "name", text)}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                {/* 🚀 เปลี่ยนคำว่า เวลา เป็น เริ่มเวลา */}
                <Text style={styles.inputLabel}>เริ่มเวลา</Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.inputBox}
                  onPress={() => openPicker(meal.id)}
                >
                  <Text style={styles.timeText}>{meal.time}</Text>
                  <Ionicons name="time" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.timePeriod}>
                  {isValidTime(meal.time)
                    ? `${meal.time} น. · ${getTimePeriod(meal.time)}`
                    : getTimePeriod(meal.time)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* 🚀 ปุ่มเพิ่มมื้ออาหารแทรกตรงนี้! */}
        <TouchableOpacity
          style={[styles.addMealBtn, !canAddMeal && styles.disabledAddMealBtn]}
          onPress={handleAddMeal}
          disabled={!canAddMeal}
        >
          <Ionicons name="add-circle-outline" size={20} color={ORANGE} />
          <Text style={styles.addMealBtnText}>เพิ่มมื้ออาหาร</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleFinish}>
            <Text style={styles.saveText}>เสร็จสิ้น</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable
          style={styles.timePickerBackdrop}
          onPress={() => setShowTimePicker(false)}
        >
          <Pressable
            style={styles.timePickerCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.timePickerTitle}>
              เลือกเวลา{activeMeal ? `มื้อ${activeMeal.name}` : "มื้ออาหาร"}
            </Text>
            <Text style={styles.timePickerHint}>
              {pickerBounds.min <= pickerBounds.max
                ? `ช่วงที่เลือกได้ ${formatTime(pickerBounds.min)}–${formatTime(pickerBounds.max)} · เว้นระยะอย่างน้อย 2 ชั่วโมง`
                : "ไม่มีช่วงเวลาที่เลือกได้ ต้องปรับเวลามื้อข้างเคียงก่อน"}
            </Text>

            <View style={styles.pickerColumns}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>ชั่วโมง</Text>
                <ScrollView ref={hourScrollRef} style={styles.pickerScroll} showsVerticalScrollIndicator>
                  {HOURS.map((hour) => {
                    const disabled = getClosestAllowedMinute(hour, pickerMinute) === null;
                    const selected = hour === pickerHour;
                    return (
                      <TouchableOpacity
                        key={hour}
                        disabled={disabled}
                        style={[
                          styles.pickerOption,
                          selected && styles.pickerOptionSelected,
                          disabled && styles.pickerOptionDisabled,
                        ]}
                        onPress={() => choosePickerHour(hour)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            selected && styles.pickerOptionTextSelected,
                            disabled && styles.pickerOptionTextDisabled,
                          ]}
                        >
                          {String(hour).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>นาที</Text>
                <ScrollView ref={minuteScrollRef} style={styles.pickerScroll} showsVerticalScrollIndicator>
                  {MINUTES.map((minute) => {
                    const disabled = !isPickerTimeAllowed(pickerHour, minute);
                    const selected = minute === pickerMinute;
                    return (
                      <TouchableOpacity
                        key={minute}
                        disabled={disabled}
                        style={[
                          styles.pickerOption,
                          selected && styles.pickerOptionSelected,
                          disabled && styles.pickerOptionDisabled,
                        ]}
                        onPress={() => setPickerMinute(minute)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            selected && styles.pickerOptionTextSelected,
                            disabled && styles.pickerOptionTextDisabled,
                          ]}
                        >
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={styles.timePickerCancelButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timePickerCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timePickerConfirmButton,
                  !isPickerTimeAllowed(pickerHour, pickerMinute) && styles.timePickerConfirmDisabled,
                ]}
                disabled={!isPickerTimeAllowed(pickerHour, pickerMinute)}
                onPress={() => {
                  if (!activeMealId || !isPickerTimeAllowed(pickerHour, pickerMinute)) return;
                  updateMeal(
                    activeMealId,
                    "time",
                    `${String(pickerHour).padStart(2, "0")}:${String(pickerMinute).padStart(2, "0")}`
                  );
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.timePickerConfirmText}>เลือกเวลานี้</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
