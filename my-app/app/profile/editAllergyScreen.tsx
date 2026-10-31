import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE, FONT_BOLD, FONT_REGULAR } from '@/style/editAllergy.styles';
import { BASE_URL, API_BASE_URL } from '../../constants/config';

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; emoji?: string; subCategories: Tier2Category[] };

const ALLERGY_GROUPS = [
  { id: 'milk', name: 'นมวัว', keywords: ['นม', 'ชีส', 'เนย', 'โยเกิร์ต', 'ครีม', 'เวย์', 'milk', 'cheese', 'butter', 'yogurt', 'cream', 'whey'], subCategoryKeywords: ['นมและผลิตภัณฑ์นม'] },
  { id: 'egg', name: 'ไข่ไก่', keywords: ['ไข่', 'egg'] },
  { id: 'sesame', name: 'งา', keywords: ['งา', 'sesame', 'tahini'] },
  { id: 'soy', name: 'ถั่วเหลือง', keywords: ['ถั่วเหลือง', 'เต้าหู้', 'นมถั่วเหลือง', 'ซีอิ๊ว', 'ซอสถั่วเหลือง', 'soy', 'tofu'] },
  { id: 'wheat', name: 'ข้าวสาลี', keywords: ['ข้าวสาลี', 'แป้งสาลี', 'กลูเตน', 'ขนมปัง', 'พาสต้า', 'wheat', 'gluten'] },
  { id: 'peanut', name: 'ถั่วลิสง', keywords: ['ถั่วลิสง', 'เนยถั่ว', 'peanut'] },
  { id: 'tree-nuts', name: 'ถั่วเปลือกแข็ง', keywords: ['ถั่วเปลือกแข็ง', 'อัลมอนด์', 'วอลนัท', 'พิสตาชิโอ', 'เม็ดมะม่วงหิมพานต์', 'เฮเซลนัท', 'แมคคาเดเมีย', 'พีแคน', 'almond', 'walnut', 'pistachio', 'cashew', 'hazelnut', 'macadamia', 'pecan'] },
  { id: 'shellfish', name: 'กุ้ง ปู และสัตว์น้ำเปลือกแข็ง', keywords: ['กุ้ง', 'ปู', 'กั้ง', 'ล็อบสเตอร์', 'หอย', 'shellfish', 'shrimp', 'crab', 'lobster', 'mussel', 'oyster'] },
  { id: 'fish', name: 'ปลา', keywords: ['ปลา', 'fish', 'salmon', 'tuna'] },
];

const CATEGORY_EMOJI: Record<string, string> = {
  'ผักและผลไม้': '🥬',
  'เนื้อสัตว์และโปรตีน': '🥩',
  'เครื่องปรุง/ส่วนผสม': '🧂',
};

export default function EditAllergyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

    const [currentUserId, setCurrentUserId] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => { loadUserProfile(); loadHierarchy(); }, []);

  const activeGroup = ALLERGY_GROUPS.find(group => group.id === activeGroupId);

  const matchesGroupItem = useCallback((categoryName: string, subCategory: Tier2Category, itemName: string) => {
    if (!activeGroup) return true;
    if (activeGroup.subCategoryKeywords) {
      const categoryLabel = categoryName.toLowerCase();
      const subCategoryName = subCategory.name.toLowerCase();
      return activeGroup.subCategoryKeywords.some(keyword =>
        categoryLabel.includes(keyword.toLowerCase()) ||
        subCategoryName.includes(keyword.toLowerCase())
      );
    }
    return activeGroup.keywords.some(keyword =>
      itemName.toLowerCase().includes(keyword.toLowerCase())
    );
  }, [activeGroup]);

  const goBack = () => {
    try {
      if (router.canGoBack()) { router.back(); }
      else { router.replace('/(tabs)/profile'); }
    } catch { router.replace('/(tabs)/profile'); }
  };

  // Smart auto-expand: เมื่อค้นหา ให้เปิดหมวดที่มีผลลัพธ์อัตโนมัติ
  useEffect(() => {
    if ((!searchQuery.trim() && !activeGroup) || hierarchy.length === 0) {
      if (!searchQuery.trim() && !activeGroup) {
        setExpandedT1(new Set());
        setExpandedT2(new Set());
      }
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    const newT1 = new Set<string>();
    const newT2 = new Set<string>();
    hierarchy.forEach(cat => {
      cat.subCategories.forEach(sub => {
        const hasMatch = sub.items.some(item => {
          const itemName = item.name.toLowerCase();
          return matchesGroupItem(cat.name, sub, item.name) &&
            (!q || itemName.includes(q));
        });
        if (hasMatch) {
          newT1.add(cat.id);
          newT2.add(sub.id);
        }
      });
    });
    if (newT1.size > 0) setExpandedT1(prev => { const merged = new Set(prev); newT1.forEach(id => merged.add(id)); return merged; });
    if (newT2.size > 0) setExpandedT2(prev => { const merged = new Set(prev); newT2.forEach(id => merged.add(id)); return merged; });
  }, [searchQuery, hierarchy, activeGroup, matchesGroupItem]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  };

  const loadUserProfile = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) { setLoading(false); return; }
      const userObj = JSON.parse(userJson);
      const userId = userObj.user_id;
      if (!userId) { setLoading(false); return; }
      setCurrentUserId(userId);
      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${userId}`);
      const json = await response.json();
      if (json.success && json.data) {
        // v2: ใช้ allergies_v2 เป็นหลัก (structured labels)
        const v2 = json.data.allergies_v2;
        if (Array.isArray(v2) && v2.length > 0) {
          const labels = v2.map((a: any) => String(a.label || a.code || '')).filter(Boolean);
          setSelectedAllergies(labels);
        } else {
          // Fallback: legacy allergies object
          const rawAllergies = json.data.allergies;
          const safeCategory = (arr: any): any[] => Array.isArray(arr) ? arr.filter(Boolean) : [];
          let allItems: string[] = [];
          if (rawAllergies && typeof rawAllergies === 'object' && !Array.isArray(rawAllergies)) {
            allItems = [
              ...safeCategory(rawAllergies.veg),
              ...safeCategory(rawAllergies.condiment),
              ...safeCategory(rawAllergies.meat),
              ...safeCategory(rawAllergies.other),
            ];
          } else if (Array.isArray(rawAllergies)) {
            allItems = rawAllergies.filter(Boolean);
          }
          setSelectedAllergies(allItems);
        }
      }
    } catch (error) { console.error('Load profile error:', error); }
    finally { setLoading(false); }
  };

  const loadHierarchy = async () => {
    setHierarchyLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setHierarchy(json.data);
      }
    } catch (error) { console.error('Load hierarchy error:', error); }
    finally { setHierarchyLoading(false); }
  };

  const toggleAllergy = (itemName: string) => {
    const clean = String(itemName);
    setSelectedAllergies(prev =>
      prev.includes(clean) ? prev.filter(x => x !== clean) : [...prev, clean]
    );
  };

  const removeAllergy = (name: string) => {
    const itemName = String(name);
    setSelectedAllergies(prev => prev.filter(x => x !== itemName));
  };

  const saveAllergies = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const allHierarchyNames = new Set(
        hierarchy.flatMap(category =>
          category.subCategories.flatMap(subCategory =>
            subCategory.items.map(item => item.name)
          )
        )
      );
      const allergies = {
        veg: [] as string[],
        condiment: [] as string[],
        meat: [] as string[],
        other: [] as string[],
      };

      selectedAllergies.filter(Boolean).forEach(name => {
        if (!allHierarchyNames.has(name)) {
          allergies.other.push(name);
          return;
        }

        hierarchy.forEach(category => {
          category.subCategories.forEach(subCategory => {
            subCategory.items.forEach(item => {
              if (item.name !== name) return;
              const categoryName = (category.name || '').toLowerCase();
              if (categoryName.includes('ผัก') || categoryName.includes('ผลไม้')) {
                allergies.veg.push(name);
              } else if (categoryName.includes('เครื่อง') || categoryName.includes('ปรุง')) {
                allergies.condiment.push(name);
              } else if (
                categoryName.includes('เนื้อ') ||
                categoryName.includes('สัตว์') ||
                categoryName.includes('โปรตีน')
              ) {
                allergies.meat.push(name);
              } else {
                allergies.other.push(name);
              }
            });
          });
        });
      });

      const allergies_v2 = selectedAllergies.filter(Boolean).map(name => ({
        type: 'specific' as const,
        code: String(name).toLowerCase().replace(/\s+/g, '_'),
        label: String(name),
        ingredient_id: null,
      }));

      const response = await fetch(`${BASE_URL}/api/users/allergies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, allergies, allergies_v2 }),
      });
      const json = await response.json();
      if (response.ok && json.success) {
        showNotification('บันทึกสำเร็จ', 'success');
        setTimeout(() => goBack(), 800);
      } else {
        showNotification(json.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    } catch {
      showNotification('เกิดข้อผิดพลาด', 'error');
    } finally { setSaving(false); }
  };

  const clearAllAllergies = () => {
    setSelectedAllergies([]);
  };

  const addCustomAllergy = () => {
    const name = customInput.trim();
    if (!name) return;
    setSelectedAllergies(prev => prev.includes(name) ? prev : [...prev, name]);
    setCustomInput('');
  };

  const toggleT1 = (id: string) => {
    setExpandedT1(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleT2 = (id: string) => {
    setExpandedT2(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countSelectedInT1 = (cat: Tier1Category) => {
    let count = 0;
    for (const sub of cat.subCategories) {
      for (const item of sub.items) {
        if (selectedAllergies.includes(item.name)) count++;
      }
    }
    return count;
  };

  const filteredHierarchy = hierarchy.map(cat => ({
        ...cat,
        subCategories: cat.subCategories.map(sub => ({
          ...sub,
          items: sub.items.filter(item => {
            const itemName = item.name.toLowerCase();
            const matchesSearch = !searchQuery.trim() ||
              itemName.includes(searchQuery.trim().toLowerCase());
            return matchesGroupItem(cat.name, sub, item.name) && matchesSearch;
          }),
        })).filter(sub => sub.items.length > 0),
      })).filter(cat => cat.subCategories.length > 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>แก้ไขภูมิแพ้</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขภูมิแพ้</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!showDetails ? (
          <>
            <Text style={styles.sectionTitle}>อาหารที่คุณแพ้</Text>
            <Text style={styles.sectionSubtitle}>เลือกประเภทอาหารที่คุณแพ้เพื่อดูวัตถุดิบที่เกี่ยวข้อง</Text>

            <View style={styles.groupList}>
              {ALLERGY_GROUPS.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => {
                    setActiveGroupId(group.id);
                    setSearchQuery('');
                    setShowDetails(true);
                  }}
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

            <View style={{ marginTop: 22, backgroundColor: '#FFF8EC', borderRadius: 14, borderWidth: 1, borderColor: '#F0D3A3', padding: 14 }}>
              <Text style={{ fontSize: 15, color: '#6B5A3D', fontFamily: FONT_BOLD, marginBottom: 8 }}>
                รายการที่เลือก ({selectedAllergies.length})
              </Text>
              {selectedAllergies.length > 0 ? (
                <View style={styles.chipContainer}>
                  {selectedAllergies.map(name => (
                    <View key={name} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 14, color: '#777', fontFamily: FONT_REGULAR }}>
                  ยังไม่มีรายการที่เลือก
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 20 }]}
              onPress={() => {
                setActiveGroupId(null);
                setSearchQuery('');
                setShowDetails(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>เพิ่มเติม</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDetails(false);
                  setActiveGroupId(null);
                  setSearchQuery('');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel="ย้อนกลับไปเลือกประเภทอาหาร"
              >
                <Ionicons name="arrow-back" size={22} color={ORANGE} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>
                {activeGroup ? `วัตถุดิบในกลุ่ม${activeGroup.name}` : 'เลือกวัตถุดิบที่แพ้'}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {activeGroup
                ? `เลือกวัตถุดิบที่เกี่ยวข้องกับ${activeGroup.name}`
                : 'เลือกวัตถุดิบที่คุณแพ้หรือแพ้อาหาร (ถ้ามี)'}
            </Text>

        <View style={[styles.searchWrap, { marginBottom: 14 }]}>
          <Ionicons name="search-outline" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาวัตถุดิบ..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="ล้างคำค้นหา"
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {hierarchyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        ) : filteredHierarchy.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'ไม่พบวัตถุดิบที่ตรงกับคำค้นหาในกลุ่มนี้'
              : activeGroup
                ? `ไม่พบวัตถุดิบที่เกี่ยวข้องกับ${activeGroup.name} สามารถเพิ่มรายการเองด้านล่างได้`
                : 'ไม่พบข้อมูลวัตถุดิบ'}
          </Text>
        ) : (
          filteredHierarchy.map(cat => {
            if (activeGroup) {
              return (
                <View key={cat.id}>
                  {cat.subCategories.map(sub => {
                    const selectedCountInSub = sub.items.filter(item =>
                      selectedAllergies.includes(item.name)
                    ).length;
                    return (
                      <View key={`${cat.id}-${sub.id}`} style={[styles.categoryCard, styles.categoryCardExpanded]}>
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryHeaderLeft}>
                            <Text style={styles.categoryEmoji}>
                              {CATEGORY_EMOJI[cat.name] || cat.emoji || '📦'}
                            </Text>
                            <Text style={styles.categoryName}>{sub.name}</Text>
                            {selectedCountInSub > 0 && (
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{selectedCountInSub}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.subCategoryArea}>
                          <View style={styles.chipContainer}>
                            {sub.items.map(item => {
                              const isSelected = selectedAllergies.includes(item.name);
                              return (
                                <TouchableOpacity
                                  key={item.id}
                                  style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                                  onPress={() => toggleAllergy(item.name)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                                    {item.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            }

            const isExpanded = expandedT1.has(cat.id);
            const selectedCount = countSelectedInT1(cat);
            const emoji = CATEGORY_EMOJI[cat.name] || cat.emoji || '📦';
            return (
              <View key={cat.id} style={[styles.categoryCard, isExpanded && styles.categoryCardExpanded]}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleT1(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    {selectedCount > 0 && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{selectedCount}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#999" />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.subCategoryArea}>
                    {cat.subCategories.map(sub => {
                      const isSubExpanded = expandedT2.has(sub.id);
                      const selectedCountInSub = sub.items.filter(item =>
                        selectedAllergies.includes(item.name)
                      ).length;
                      return (
                        <View key={sub.id} style={styles.subCategoryCard}>
                          <TouchableOpacity
                            style={styles.subCategoryHeader}
                            onPress={() => toggleT2(sub.id)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                              <Text style={styles.subCategoryName}>{sub.name}</Text>
                              {selectedCountInSub > 0 && (
                                <View style={styles.categoryBadge}>
                                  <Text style={styles.categoryBadgeText}>{selectedCountInSub}</Text>
                                </View>
                              )}
                            </View>
                            <Ionicons
                              name={isSubExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="#C67A1A"
                            />
                          </TouchableOpacity>
                          {isSubExpanded && (
                            <View style={styles.chipContainer}>
                              {sub.items.map(item => {
                                const isSelected = selectedAllergies.includes(item.name);
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                                    onPress={() => toggleAllergy(item.name)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
                                      {item.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16, gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#F5F5F5',
              borderWidth: 1,
              borderColor: '#DDD',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#222',
              fontFamily: FONT_REGULAR,
            }}
            placeholder="เพิ่มวัตถุดิบเอง..."
            placeholderTextColor="#AAA"
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={addCustomAllergy}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={{ backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}
            onPress={addCustomAllergy}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFF', fontSize: 14, fontFamily: FONT_BOLD }}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 8, backgroundColor: '#FFF8EC', borderRadius: 14, borderWidth: 1, borderColor: '#F0D3A3', padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, color: '#6B5A3D', fontFamily: FONT_BOLD }}>
              รายการที่เลือก ({selectedAllergies.length})
            </Text>
            {selectedAllergies.length > 0 && (
              <TouchableOpacity
                onPress={() => Alert.alert('ล้างทั้งหมด', 'ต้องการยกเลิกการเลือกทั้งหมดหรือไม่?', [
                  { text: 'ยกเลิก', style: 'cancel' },
                  { text: 'ล้าง', style: 'destructive', onPress: clearAllAllergies },
                ])}
              >
                <Text style={{ color: '#A66B00', fontSize: 13, fontFamily: FONT_BOLD }}>ล้างทั้งหมด</Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedAllergies.length === 0 ? (
            <Text style={{ fontSize: 14, color: '#777', fontFamily: FONT_BOLD }}>-</Text>
          ) : (
            <View style={styles.chipContainer}>
              {selectedAllergies.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[styles.chip, styles.summaryChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                  onPress={() => removeAllergy(name)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`ลบ ${name}`}
                >
                  <Text style={[styles.chipText, styles.summaryChipTextSelected]}>{name}</Text>
                  <Ionicons name="close-circle" size={14} color="#888" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={saveAllergies}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>บันทึก</Text>
          )}
        </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}