import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE } from "./step6-1.styles";
import AllergyClearConfirmModal from "./AllergyClearConfirmModal";

const ALLERGY_GROUPS = [
  { id: "milk", name: "นมวัว" },
  { id: "egg", name: "ไข่ไก่" },
  { id: "sesame", name: "งา" },
  { id: "soy", name: "ถั่วเหลือง" },
  { id: "wheat", name: "ข้าวสาลี" },
  { id: "peanut", name: "ถั่วลิสง" },
  { id: "tree-nuts", name: "ถั่วเปลือกแข็ง" },
  { id: "shellfish", name: "กุ้ง ปู และสัตว์น้ำเปลือกแข็ง" },
  { id: "fish", name: "ปลา" },
];

function getSelectedAllergies(form: ReturnType<typeof useRegister>["form"]): string[] {
  if (Array.isArray(form.allergies_v2) && form.allergies_v2.length > 0) {
    return [...new Set(form.allergies_v2.map(item => String(item.label || item.code || "")).filter(Boolean))];
  }

  const legacy = form.allergies as Record<string, unknown> | string[] | null;
  if (Array.isArray(legacy)) return [...new Set(legacy.filter(Boolean).map(String))];
  if (!legacy || typeof legacy !== "object") return [];

  return [...new Set(["veg", "condiment", "meat", "other"].flatMap(key =>
    Array.isArray(legacy[key]) ? legacy[key].filter(Boolean).map(String) : []
  ))];
}

export default function RegisterStep6Screen() {
  const { form, updateForm } = useRegister();
  const selectedAllergies = useMemo(() => getSelectedAllergies(form), [form]);
  const [customInput, setCustomInput] = React.useState("");
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const noAllergies = form.hasAllergies === false && selectedAllergies.length === 0;
  const makeV2 = (names: string[]) => names.map(label => ({
    type: "specific" as const,
    code: label.toLowerCase().replace(/\s+/g, "_"),
    label,
    ingredient_id: Array.isArray(form.allergies_v2)
      ? form.allergies_v2.find(item => item.label === label)?.ingredient_id || null
      : null,
  }));

  const updateSelection = (names: string[]) => {
    const unique = [...new Set(names.filter(Boolean))];
    const previous = form.allergies as Record<string, unknown> | string[] | null;
    const allergies = { veg: [] as string[], condiment: [] as string[], meat: [] as string[], other: [] as string[] };
    const retained = new Set<string>();
    if (previous && !Array.isArray(previous)) {
      (["veg", "condiment", "meat", "other"] as const).forEach(category => {
        const values = Array.isArray(previous[category])
          ? previous[category].filter((name): name is string => typeof name === "string" && unique.includes(name))
          : [];
        allergies[category].push(...values);
        values.forEach(name => retained.add(name));
      });
    }
    unique.filter(name => !retained.has(name)).forEach(name => allergies.other.push(name));
    updateForm({
      // An empty selection means "not answered/cleared", not "no allergies".
      hasAllergies: unique.length > 0 ? true : null,
      allergies,
      allergies_v2: makeV2(unique),
    });
  };

  const clearAllAllergies = () => {
    updateForm({
      hasAllergies: null,
      allergies: { veg: [], condiment: [], meat: [], other: [] },
      allergies_v2: [],
    });
  };

  const openGroup = (groupId: string, groupName: string) => {
    if (noAllergies) {
      Alert.alert("เลือกไม่ได้", "ยกเลิกตัวเลือกไม่มีอาหารที่แพ้ก่อนเลือกวัตถุดิบ");
      return;
    }

    router.push({
      pathname: "/register/step6-2",
      params: { groupId, groupName },
    } as any);
  };

  const openAllIngredients = () => {
    if (noAllergies) {
      Alert.alert("เลือกไม่ได้", "ยกเลิกตัวเลือกไม่มีอาหารที่แพ้ก่อนเพิ่มวัตถุดิบ");
      return;
    }
    router.push("/register/step6-2" as any);
  };

  const addCustomAllergy = () => {
    const name = customInput.trim();
    if (!name) return;
    if (noAllergies) {
      Alert.alert("เพิ่มรายการไม่ได้", "ยกเลิกตัวเลือกไม่มีอาหารที่แพ้ก่อนเพิ่มวัตถุดิบ");
      return;
    }
    if (!selectedAllergies.includes(name)) updateSelection([...selectedAllergies, name]);
    setCustomInput("");
  };

  const toggleNoAllergies = () => {
    if (noAllergies) {
      updateForm({ hasAllergies: null });
      return;
    }
    if (selectedAllergies.length > 0) {
      Alert.alert("ยืนยันการเลือก", "การเลือกไม่มีอาหารที่แพ้จะล้างรายการที่เลือกทั้งหมด", [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ยืนยัน",
          style: "destructive",
          onPress: () => updateForm({
            hasAllergies: false,
            allergies: { veg: [], condiment: [], meat: [], other: [] },
            allergies_v2: [],
          }),
        },
      ]);
      return;
    }
    updateForm({ hasAllergies: false, allergies: { veg: [], condiment: [], meat: [], other: [] }, allergies_v2: [] });
  };

  const continueRegistration = () => {
    updateForm({
      hasAllergies: selectedAllergies.length > 0 ? true : noAllergies ? false : null,
      allergies_v2: noAllergies ? [] : makeV2(selectedAllergies),
    });
    router.push("/register/step7" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.replace("/register/step5" as any)}
          style={styles.backIcon}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ลงทะเบียนผู้ใช้งาน</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>6.อาหารที่คุณแพ้</Text>
        <Text style={styles.sectionSubtitle}>
          เลือกประเภทอาหารที่คุณแพ้เพื่อดูวัตถุดิบที่เกี่ยวข้อง
        </Text>

        <View style={styles.groupList}>
          {ALLERGY_GROUPS.map(group => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => openGroup(group.id, group.name)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`เลือกวัตถุดิบสำหรับ${group.name}`}
            >
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupHint}>แตะเพื่อเลือกวัตถุดิบ</Text>
              </View>
              <View style={styles.groupRight}>
                <Ionicons name="chevron-forward" size={17} color="#888" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.noneBtn, noAllergies && styles.noneBtnActive]}
          onPress={toggleNoAllergies}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: noAllergies }}
        >
          <Text style={[styles.noneBtnText, noAllergies && styles.noneBtnTextActive]}>ไม่มีอาหารที่แพ้</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addOutlineBtn}
          onPress={openAllIngredients}
          activeOpacity={0.8}
        >
          <Text style={styles.addOutlineBtnText}>เพิ่มเติม</Text>
        </TouchableOpacity>

        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder="เพิ่มวัตถุดิบเอง..."
            placeholderTextColor="#999"
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={addCustomAllergy}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtnSmall} onPress={addCustomAllergy} activeOpacity={0.8}>
            <Text style={styles.addBtnSmallText}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              รายการที่เลือก ({selectedAllergies.length})
            </Text>
            {selectedAllergies.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowClearConfirm(true)}
              >
                <Text style={styles.summaryClearText}>
                  ล้างทั้งหมด
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {noAllergies ? (
            <View style={styles.summaryItems}>
              <View
                style={styles.summaryItem}
                accessibilityRole="text"
                accessibilityLabel="ไม่มีอาหารที่แพ้"
              >
                <Text style={styles.summaryItemText}>ไม่มีอาหารที่แพ้</Text>
                <Ionicons name="checkmark-circle" size={14} color={ORANGE} />
              </View>
            </View>
          ) : selectedAllergies.length > 0 ? (
            <View style={styles.summaryItems}>
              {selectedAllergies.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.summaryItem}
                  onPress={() =>
                    updateSelection(
                      selectedAllergies.filter((item) => item !== name)
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`ลบ ${name}`}
                >
                  <Text style={styles.summaryItemText}>{name}</Text>
                  <Ionicons name="close-circle" size={14} color="#888" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmptyText}>
              ยังไม่มีรายการที่เลือก
            </Text>
          )}
        </View>

        <View style={styles.spacer} />
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.replace("/register/step5" as any)}
          >
            <Text style={styles.cancelBtnText}>ย้อนกลับ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={continueRegistration}
          >
            <Text style={styles.confirmBtnText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AllergyClearConfirmModal
        visible={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearAllAllergies();
          setShowClearConfirm(false);
        }}
      />
    </SafeAreaView>
  );
}
