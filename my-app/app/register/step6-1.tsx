import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";

import styles, {
  ORANGE,
} from "./step6-1.styles";

type AllergyForm = {
  selectedGroups: string[];
  details: Record<string, string[]>;
  detailNames: Record<string, string[]>;
  allInGroup: string[];
};

const GROUPS = [
  {
    id: "milk",
    name: "นมวัว",
    keywords: "นม ผลิตภัณฑ์จากนม",
  },
  {
    id: "egg",
    name: "ไข่ไก่",
    keywords: "ไข่ ไข่เป็ด ไข่นกกระทา",
  },
  {
    id: "sesame",
    name: "งา",
    keywords: "งาดำ งาขาว น้ำมันงา",
  },
  {
    id: "soy",
    name: "ถั่วเหลือง",
    keywords: "เต้าหู้ นมถั่วเหลือง ซีอิ๊ว",
  },
  {
    id: "wheat",
    name: "ข้าวสาลี",
    keywords: "แป้งสาลี กลูเตน ขนมปัง",
  },
  {
    id: "peanut",
    name: "ถั่วลิสง",
    keywords: "ถั่วลิสง เนยถั่ว",
  },
  {
    id: "tree_nuts",
    name: "ถั่วเปลือกแข็ง",
    keywords: "อัลมอนด์ วอลนัท พิสตาชิโอ เม็ดมะม่วงหิมพานต์",
  },
  {
    id: "shellfish",
    name: "กุ้ง ปู และสัตว์น้ำเปลือกแข็ง",
    keywords: "กุ้ง ปู กั้ง ล็อบสเตอร์",
  },
  {
    id: "fish",
    name: "ปลา",
    keywords: "ปลาทูน่า ปลาแซลมอน ปลาทู",
  },
];

const EMPTY_FORM: AllergyForm = {
  selectedGroups: [],
  details: {},
  detailNames: {},
  allInGroup: [],
};

function normalizeAllergies(value: any): AllergyForm {
  if (!value || Array.isArray(value)) {
    return {
      selectedGroups: [],
      details: {},
      detailNames: {},
      allInGroup: [],
    };
  }

  return {
    selectedGroups: Array.isArray(value.selectedGroups)
      ? value.selectedGroups
      : [],
    details: value.details || {},
    detailNames: value.detailNames || {},
    allInGroup: Array.isArray(value.allInGroup)
      ? value.allInGroup
      : [],
  };
}

export default function RegisterStep6Screen() {
  const { form, updateForm } = useRegister();

  const [search, setSearch] = useState("");

  const [allergies, setAllergies] = useState<AllergyForm>(() =>
    normalizeAllergies(form.allergies)
  );

  useEffect(() => {
    setAllergies(normalizeAllergies(form.allergies));
  }, [form.allergies]);

  const hasNone =
    form.hasAllergies === false &&
    allergies.selectedGroups.length === 0;

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();

    if (!q) return GROUPS;

    return GROUPS.filter((group) =>
      `${group.name} ${group.keywords}`
        .toLocaleLowerCase()
        .includes(q)
    );
  }, [search]);

  const selectedGroupNames = useMemo(() => {
    return allergies.selectedGroups.map((id) => {
      const group = GROUPS.find((item) => item.id === id);
      return group?.name || id;
    });
  }, [allergies.selectedGroups]);

  const saveAllergies = (
    next: AllergyForm,
    has: boolean
  ) => {
    setAllergies(next);

    updateForm({
      hasAllergies: has,
      allergies: next,
    });
  };

  const openGroup = (groupId: string) => {
    if (hasNone) {
      Alert.alert(
        "เลือกประเภทวัตถุดิบ",
        "หากต้องการเลือกรายการแพ้อาหาร กรุณายกเลิกตัวเลือกไม่มีอาหารที่แพ้ก่อน"
      );
      return;
    }

    const next: AllergyForm = {
      ...allergies,
      selectedGroups: allergies.selectedGroups.includes(groupId)
        ? allergies.selectedGroups
        : [...allergies.selectedGroups, groupId],
    };

    saveAllergies(next, true);

    const group = GROUPS.find(
      (item) => item.id === groupId
    );

    router.push({
      pathname: "/register/step6-2",
      params: {
        groupId,
        groupName: group?.name || groupId,
      },
    } as any);
  };

  const toggleNone = () => {
    if (hasNone) {
      saveAllergies(
        {
          selectedGroups: [],
          details: {},
          detailNames: {},
          allInGroup: [],
        },
        true
      );
      return;
    }

    if (allergies.selectedGroups.length > 0) {
      Alert.alert(
        "ยืนยันการเลือก",
        "หากเลือกไม่มีอาหารที่แพ้ ระบบจะล้างรายการที่เลือกไว้ทั้งหมด",
        [
          {
            text: "ยกเลิก",
            style: "cancel",
          },
          {
            text: "ยืนยัน",
            onPress: () => {
              saveAllergies(
                {
                  selectedGroups: [],
                  details: {},
                  detailNames: {},
                  allInGroup: [],
                },
                false
              );
            },
          },
        ]
      );

      return;
    }

    saveAllergies(
      {
        selectedGroups: [],
        details: {},
        detailNames: {},
        allInGroup: [],
      },
      false
    );
  };

  const removeGroup = (groupId: string) => {
    const next: AllergyForm = {
      selectedGroups: allergies.selectedGroups.filter(
        (id) => id !== groupId
      ),
      details: { ...allergies.details },
      detailNames: { ...allergies.detailNames },
      allInGroup: allergies.allInGroup.filter(
        (id) => id !== groupId
      ),
    };

    delete next.details[groupId];
    delete next.detailNames[groupId];

    saveAllergies(
      next,
      next.selectedGroups.length > 0
    );
  };

  const handleNext = () => {
    const hasSelectedGroups =
      allergies.selectedGroups.length > 0;

    updateForm({
      hasAllergies: hasSelectedGroups
        ? true
        : form.hasAllergies,
      allergies: hasSelectedGroups
        ? allergies
        : { ...EMPTY_FORM },
    });

    router.push("/register/step7" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>
          ลงทะเบียนผู้ใช้งาน
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>
          6. วัตถุดิบที่แพ้
        </Text>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.subtitle}>
          เลือกประเภทเพื่อระบุวัตถุดิบที่ต้องการหลีกเลี่ยง
        </Text>

        {/* ช่องค้นหา */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#777"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาประเภทวัตถุดิบ..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            blurOnSubmit={false}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="ล้างคำค้นหา"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* รายการประเภทวัตถุดิบ 2 คอลัมน์ */}
        <View style={styles.groupList}>
          {filteredGroups.map((group) => {
            const selected =
              allergies.selectedGroups.includes(group.id);

            const names =
              allergies.detailNames[group.id] || [];

            const allSelected =
              allergies.allInGroup.includes(group.id);

            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupCard,
                  selected && styles.groupCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => openGroup(group.id)}
              >
                <View style={styles.groupInfo}>
                  <Text
                    style={[
                      styles.groupName,
                      selected && styles.groupNameSelected,
                    ]}
                  >
                    {group.name}
                  </Text>

                  {!selected ? (
                    <Text style={styles.groupHint}>
                      กดเพื่อเลือก
                    </Text>
                  ) : allSelected ? (
                    <Text style={styles.selectedDescription}>
                      เลือกทั้งหมด
                    </Text>
                  ) : names.length > 0 ? (
                    <Text
                      style={styles.selectedDescription}
                      numberOfLines={2}
                    >
                      {names.join(", ")}
                    </Text>
                  ) : (
                    <Text style={styles.groupHint}>
                      ยังไม่ได้เลือกรายละเอียด
                    </Text>
                  )}
                </View>

                {/* ไอคอนด้านขวา */}
                <View style={styles.groupRight}>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={ORANGE}
                    />
                  )}

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color="#888"
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredGroups.length === 0 && (
            <Text style={styles.emptyText}>
              ไม่พบประเภทวัตถุดิบที่ค้นหา
            </Text>
          )}
        </View>

        {/* สรุปรายการที่เลือก */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            สรุปรายการที่เลือก
          </Text>

          {hasNone ? (
            <View style={styles.noneChip}>
              <Text style={styles.noneChipText}>
                ไม่มีอาหารที่แพ้
              </Text>

              <TouchableOpacity
                onPress={toggleNone}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="ยกเลิกไม่มีอาหารที่แพ้"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#A66B00"
                />
              </TouchableOpacity>
            </View>
          ) : selectedGroupNames.length > 0 ? (
            allergies.selectedGroups.map((id) => {
              const group = GROUPS.find(
                (item) => item.id === id
              );

              const names =
                allergies.detailNames[id] || [];

              const allSelected =
                allergies.allInGroup.includes(id);

              return (
                <View
                  key={id}
                  style={styles.summaryRow}
                >
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryGroupName}>
                      {group?.name || id}
                    </Text>

                    <Text style={styles.summaryDetail}>
                      {allSelected
                        ? "หลีกเลี่ยงทั้งหมดในกลุ่มนี้"
                        : names.length > 0
                        ? names.join(", ")
                        : "ยังไม่ได้เลือกรายละเอียด"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeGroup(id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`ลบ${group?.name || id}`}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color="#B76A00"
                    />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              ยังไม่มีรายการที่เลือก
            </Text>
          )}
        </View>

        {/* ปุ่มไม่มีอาหารที่แพ้ */}
        <TouchableOpacity
          style={[
            styles.noneButton,
            hasNone && styles.noneButtonActive,
          ]}
          onPress={toggleNone}
          activeOpacity={0.75}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hasNone }}
        >
          <Ionicons
            name={
              hasNone
                ? "checkmark-circle"
                : "ellipse-outline"
            }
            size={22}
            color={hasNone ? "#FFFFFF" : "#555"}
          />

          <Text
            style={[
              styles.noneButtonText,
              hasNone && styles.noneButtonTextActive,
            ]}
          >
            ไม่มีอาหารที่แพ้
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          หากเลือกประเภทวัตถุดิบ กรุณาระบุรายละเอียดในหน้าถัดไป
        </Text>

        {/* ปุ่มย้อนกลับและถัดไป */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace("/register/step5" as any)
            }
          >
            <Text style={styles.backText}>
              ย้อนกลับ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              ถัดไป
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}