import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE, FONT_BOLD, FONT_REGULAR } from '@/style/editAllergy.styles';
import { BASE_URL, API_BASE_URL } from '../../constants/config';

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; emoji?: string; subCategories: Tier2Category[] };

const ALLERGY_CATEGORIES = [
  { key: 'veg', label: 'ผัก/พืช', emoji: '🥬' },
  { key: 'condiment', label: 'เครื่องปรุง/ซอส', emoji: '🧂' },
  { key: 'meat', label: 'เนื้อสัตว์', emoji: '🥩' },
  { key: 'other', label: 'อื่นๆ', emoji: '🌟' },
];

export default function EditAllergyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

    const [currentUserId, setCurrentUserId] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => { loadUserProfile(); loadHierarchy(); }, []);

  const goBack = () => {
    try {
      if (router.canGoBack()) { router.back(); }
      else { router.replace('/(tabs)/profile'); }
    } catch { router.replace('/(tabs)/profile'); }
  };

  // Smart auto-expand: เมื่อค้นหา ให้เปิดหมวดที่มีผลลัพธ์อัตโนมัติ
  useEffect(() => {
    if (!modalSearchQuery.trim() || hierarchy.length === 0) {
      // Clear expansions when search is empty
      if (!modalSearchQuery.trim()) {
        setExpandedT1(new Set());
        setExpandedT2(new Set());
      }
      return;
    }
    const q = modalSearchQuery.toLowerCase();
    const newT1 = new Set<string>();
    const newT2 = new Set<string>();
    hierarchy.forEach(cat => {
      cat.subCategories.forEach(sub => {
        const hasMatch = sub.items.some(item => item.name.toLowerCase().includes(q));
        if (hasMatch) {
          newT1.add(cat.id);
          newT2.add(sub.id);
        }
      });
    });
    if (newT1.size > 0) setExpandedT1(prev => { const merged = new Set(prev); newT1.forEach(id => merged.add(id)); return merged; });
    if (newT2.size > 0) setExpandedT2(prev => { const merged = new Set(prev); newT2.forEach(id => merged.add(id)); return merged; });
  }, [modalSearchQuery, hierarchy]);

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

  const removeAllergy = async (name: string) => {
    const itemName = String(name);
    // Immutable optimistic update: create new array reference
    setSelectedAllergies(prev => prev.filter(x => x !== itemName));

    try {
      if (!currentUserId) return;
      const response = await fetch(`${BASE_URL}/api/users/allergies`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(currentUserId), itemName }),
      });
      const json = await response.json();
      if (!json.success) {
        // Rollback on failure: reload full profile
        showNotification('ลบรายการไม่สำเร็จ', 'error');
        loadUserProfile();
      }
      // On success: rely on optimistic update only - no backend sync
      // This prevents the server response from overwriting the correct
      // local state with stale or differently-structured data
    } catch (error) {
      console.error('Delete allergy error:', error);
      showNotification('ลบรายการไม่สำเร็จ', 'error');
      // Rollback on network error
      loadUserProfile();
    }
  };

  const saveAllergies = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      // Build allergies_v2 structured array from selectedAllergies
      const allergies_v2 = selectedAllergies.filter(Boolean).map(name => ({
        type: 'specific' as const,
        code: String(name).toLowerCase().replace(/\s+/g, '_'),
        label: String(name),
        ingredient_id: null,
      }));

      const response = await fetch(`${BASE_URL}/api/users/allergies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, allergies: selectedAllergies, allergies_v2 }),
      });
      const json = await response.json();
      if (json.success) {
        showNotification('บันทึกสำเร็จ', 'success');
        setTimeout(() => goBack(), 800);
      } else {
        showNotification(json.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    } catch (error) {
      showNotification('เกิดข้อผิดพลาด', 'error');
    } finally { setSaving(false); }
  };

  const clearAllAllergies = () => {
    setSelectedAllergies([]);
  };

  const toggleT1 = (id: string) => {
    setExpandedT1(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleT2 = (id: string) => {
    setExpandedT2(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  // จัดกลุ่ม selected allergies ตาม Tier1 category (ซ่อนหมวดที่ไม่มีของ)
  const getSelectedByCategory = () => {
    const groups: { catName: string; emoji: string; items: string[] }[] = [];
    hierarchy.forEach(cat => {
      const catItems: string[] = [];
      cat.subCategories.forEach(sub => {
        sub.items.forEach(item => {
          if (selectedAllergies.includes(item.name)) catItems.push(item.name);
        });
      });
      if (catItems.length > 0) groups.push({ catName: cat.name, emoji: cat.emoji || '📦', items: catItems });
    });
    // Also add items not found in any category
    const allHierarchyNames = new Set(hierarchy.flatMap(c => c.subCategories.flatMap(s => s.items.map(i => i.name))));
    const unmatched = selectedAllergies.filter(a => a && !allHierarchyNames.has(a));
    if (unmatched.length > 0) groups.push({ catName: 'อื่นๆ', emoji: '📦', items: unmatched });
    return groups;
  };

  const filteredHierarchy = modalSearchQuery.trim()
    ? hierarchy.map(cat => ({
        ...cat,
        subCategories: cat.subCategories.map(sub => ({
          ...sub,
          items: sub.items.filter(item =>
            item.name.toLowerCase().includes(modalSearchQuery.toLowerCase())
          ),
        })).filter(sub => sub.items.length > 0),
      })).filter(cat => cat.subCategories.length > 0)
    : hierarchy;

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
      {/* ─── Toast ─── */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* ─── Header ─── */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขภูมิแพ้</Text>
        <View style={styles.headerRight} />
      </View>

      {/* ─── Current Selections ─── */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>อาหารที่คุณแพ้</Text>
        <Text style={styles.sectionSubtitle}>
          {selectedAllergies.length > 0
            ? `คุณเลือก ${selectedAllergies.length} รายการ แตะ ✕ เพื่อลบ`
            : 'ยังไม่มีรายการ กดปุ่มด้านล่างเพื่อเพิ่ม'}
        </Text>

        {selectedAllergies.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {getSelectedByCategory().map((group) => (
              <View key={`group-${group.catName}`} style={styles.summaryCategoryCard}>
                <View style={styles.summaryCategoryHeader}>
                  <Text style={styles.summaryCategoryEmoji}>{group.emoji}</Text>
                  <Text style={styles.summaryCategoryName}>{group.catName}</Text>
                  <View style={styles.summaryCountBadge}>
                    <Text style={styles.summaryCountBadgeText}>{group.items.length}</Text>
                  </View>
                </View>
                <View style={styles.chipContainer}>
                  {group.items.map((item) => {
                    const displayName = String(item);
                    return (
                      <TouchableOpacity
                        key={`sel-${group.catName}-${displayName}`}
                        onPress={() => removeAllergy(displayName)}
                        style={[styles.chip, styles.summaryChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, styles.summaryChipTextSelected]}>{displayName}</Text>
                        <Ionicons name="close-circle" size={14} color="#888888" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (hierarchy.length === 0) loadHierarchy();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#DF9226" />
          <Text style={styles.addBtnText}>เพิ่มภูมิแพ้</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveAllergies}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>บันทึก</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Add Allergy Modal ─── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Modal Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' }}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setModalSearchQuery(''); }}>
              <Ionicons name="close" size={26} color="#222" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontFamily: FONT_BOLD, color: '#222' }}>เลือกภูมิแพ้</Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="ค้นหา..." 
                placeholderTextColor="#999" 
                value={modalSearchQuery} 
                onChangeText={setModalSearchQuery} 
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Hierarchy List */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
            {hierarchyLoading ? (
              <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
            ) : filteredHierarchy.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>ไม่พบรายการ</Text>
              </View>
            ) : (
              filteredHierarchy.map(cat => {
                const isExpanded = expandedT1.has(cat.id);
                const selectedCount = countSelectedInT1(cat);
                return (
                  <View key={cat.id} style={[styles.categoryCard, isExpanded && styles.categoryCardExpanded]}>
                    <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleT1(cat.id)} activeOpacity={0.7}>
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={styles.categoryEmoji}>{cat.emoji || '📦'}</Text>
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
                          return (
                            <View key={sub.id} style={styles.subCategoryCard}>
                              <TouchableOpacity style={styles.subCategoryHeader} onPress={() => toggleT2(sub.id)} activeOpacity={0.7}>
                                <Text style={styles.subCategoryName}>{sub.name}</Text>
                                <Ionicons name={isSubExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#C67A1A" />
                              </TouchableOpacity>
                              {isSubExpanded && (
                                <View style={styles.chipContainer}>
                                  {sub.items.map(item => {
                                    const isSelected = selectedAllergies.includes(item.name);
                                    return (
                                      <TouchableOpacity key={item.id} style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleAllergy(item.name)} activeOpacity={0.7}>
                                        <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>{item.name}</Text>
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
          </ScrollView>

          {/* ─── Selected Items (Grouped Category Cards) ─── */}
          <View style={styles.selectedStrip}>
            <Text style={styles.selectedStripTitle}>รายการที่คุณเลือก ({selectedAllergies.length})</Text>
            {selectedAllergies.length === 0 ? (
              <Text style={styles.noneText}>ยังไม่มีรายการ</Text>
            ) : (
              <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ gap: 8 }}>
                {getSelectedByCategory().map((group) => (
                  <View key={`modal-group-${group.catName}`} style={styles.summaryCategoryCard}>
                    <View style={styles.summaryCategoryHeader}>
                      <Text style={styles.summaryCategoryEmoji}>{group.emoji}</Text>
                      <Text style={styles.summaryCategoryName}>{group.catName}</Text>
                      <View style={styles.summaryCountBadge}>
                        <Text style={styles.summaryCountBadgeText}>{group.items.length}</Text>
                      </View>
                    </View>
                    <View style={styles.chipContainer}>
                      {group.items.map((item) => {
                        const displayName = String(item);
                        return (
                          <TouchableOpacity
                            key={`modal-sel-${group.catName}-${displayName}`}
                            onPress={() => removeAllergy(displayName)}
                            style={[styles.chip, styles.summaryChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, styles.summaryChipTextSelected]}>{displayName}</Text>
                            <Ionicons name="close-circle" size={14} color="#888888" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─── Bottom Buttons ─── */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => {
                if (selectedAllergies.length > 0) {
                  Alert.alert('ล้างทั้งหมด', 'ต้องการยกเลิกการเลือกทั้งหมดหรือไม่?', [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'ล้าง', style: 'destructive', onPress: clearAllAllergies },
                  ]);
                }
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>ยกเลิกทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowAddModal(false); setModalSearchQuery(''); }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}