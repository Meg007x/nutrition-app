import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE, FONT_BOLD } from '@/style/editDislikedFood.styles';
import { BASE_URL, API_BASE_URL } from '../../constants/config';

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; emoji?: string; subCategories: Tier2Category[] };

export default function EditDislikedFoodScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => { loadUserProfile(); loadHierarchy(); }, []);

  const goBack = () => {
    try { if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)/profile'); } }
    catch { router.replace('/(tabs)/profile'); }
  };

  useEffect(() => {
    if (!modalSearchQuery.trim() || hierarchy.length === 0) {
      if (!modalSearchQuery.trim()) { setExpandedT1(new Set()); setExpandedT2(new Set()); }
      return;
    }
    const q = modalSearchQuery.toLowerCase();
    const newT1 = new Set<string>();
    const newT2 = new Set<string>();
    hierarchy.forEach(cat => {
      cat.subCategories.forEach(sub => {
        const hasMatch = sub.items.some(item => item.name.toLowerCase().includes(q));
        if (hasMatch) { newT1.add(cat.id); newT2.add(sub.id); }
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
      const response = await fetch(`${BASE_URL}/api/users/dislikes?userId=${userId}`);
      const json = await response.json();
      if (json.success) {
        const v2 = json.disliked_ingredients_v2 || [];
        if (Array.isArray(v2) && v2.length > 0) {
          setSelectedFoods(new Set(v2.map((d: any) => d.name).filter(Boolean)));
        } else {
          const legacy = json.data || {};
          const all: string[] = [];
          Object.values(legacy).forEach((arr: any) => { if (Array.isArray(arr)) arr.forEach((n: any) => all.push(String(n))); });
          setSelectedFoods(new Set(all.filter(Boolean)));
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
      if (json.success && Array.isArray(json.data)) { setHierarchy(json.data); }
    } catch (error) { console.error('Load hierarchy error:', error); }
    finally { setHierarchyLoading(false); }
  };

  const toggleFood = (name: string) => {
    setModalSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    });
  };
  const toggleT1 = (id: string) => {
    setExpandedT1(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };
  const toggleT2 = (id: string) => {
    setExpandedT2(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const countSelectedInT1 = (cat: Tier1Category) => {
    let count = 0;
    cat.subCategories.forEach(sub => sub.items.forEach(item => { if (modalSelected.has(item.name)) count++; }));
    return count;
  };
  const countSelectedInT2 = (sub: Tier2Category) => sub.items.filter(item => modalSelected.has(item.name)).length;

  const getSelectedByCategory = () => {
    const groups: { catName: string; emoji: string; items: string[] }[] = [];
    hierarchy.forEach(cat => {
      const catItems: string[] = [];
      cat.subCategories.forEach(sub => sub.items.forEach(item => { if (selectedFoods.has(item.name)) catItems.push(item.name); }));
      if (catItems.length > 0) groups.push({ catName: cat.name, emoji: cat.emoji || '📦', items: catItems });
    });
    const allHierarchyNames = new Set(hierarchy.flatMap(c => c.subCategories.flatMap(s => s.items.map(i => i.name))));
    const unmatched = Array.from(selectedFoods).filter(a => a && !allHierarchyNames.has(a));
    if (unmatched.length > 0) groups.push({ catName: 'อื่นๆ', emoji: '📦', items: unmatched });
    return groups;
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const selectedArray = Array.from(selectedFoods).filter(Boolean);
      const disliked_ingredients_v2 = selectedArray.map(name => ({
        ingredient_id: null,
        name: String(name),
        category_key: '',
        category_name: '',
        sub_category: '',
      }));
      const disliked_foods: Record<string, string[]> = {};
      hierarchy.forEach(cat => {
        const catItems = cat.subCategories.flatMap(sub => sub.items.filter(i => selectedFoods.has(i.name)).map(i => i.name));
        if (catItems.length > 0) disliked_foods[cat.id] = catItems;
      });
      const response = await fetch(`${BASE_URL}/api/users/dislikes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, disliked_ingredients_v2, disliked_foods }),
      });
      const json = await response.json();
      if (json.success) {
        const clearedSlots = json.cleared_slots || 0;
        const msg = clearedSlots > 0 ? `บันทึกสำเร็จ (ล้าง ${clearedSlots} มื้อที่มีวัตถุดิบที่ไม่ชอบ)` : 'บันทึกสำเร็จ';
        showNotification(msg, 'success');
        setTimeout(() => goBack(), 1200);
      } else { showNotification(json.message || 'บันทึกไม่สำเร็จ', 'error'); }
    } catch { showNotification('เกิดข้อผิดพลาด', 'error'); }
    finally { setSaving(false); }
  };

  const handleRemoveFood = (name: string) => {
    setSelectedFoods(prev => { const next = new Set(prev); next.delete(name); return next; });
  };

  const handleClearAll = () => {
    Alert.alert('ล้างทั้งหมด', 'ต้องการยกเลิกการเลือกทั้งหมดหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ล้าง', style: 'destructive', onPress: () => setSelectedFoods(new Set()) },
    ]);
  };

  const openSelector = () => {
    setModalSelected(new Set(selectedFoods));
    setShowSelectorModal(true);
  };

  const confirmSelector = () => {
    setSelectedFoods(new Set(modalSelected));
    setShowSelectorModal(false);
    setModalSearchQuery('');
  };

  const filteredHierarchy = modalSearchQuery.trim()
    ? hierarchy.map(cat => ({
        ...cat,
        subCategories: cat.subCategories.map(sub => ({
          ...sub,
          items: sub.items.filter(item => item.name.toLowerCase().includes(modalSearchQuery.toLowerCase())),
        })).filter(sub => sub.items.length > 0),
      })).filter(cat => cat.subCategories.length > 0)
    : hierarchy;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack} style={styles.backIcon}><Ionicons name='chevron-back' size={28} color='#fff' /></TouchableOpacity>
          <Text style={styles.headerTitle}>อาหารที่ไม่ชอบ</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size='large' color={ORANGE} /></View>
      </SafeAreaView>
    );
  }

  const selectedArray = Array.from(selectedFoods).filter(Boolean);
  const grouped = getSelectedByCategory();

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}><Ionicons name='chevron-back' size={28} color='#fff' /></TouchableOpacity>
        <Text style={styles.headerTitle}>อาหารที่ไม่ชอบ</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>วัตถุดิบที่คุณไม่ชอบ</Text>
        <Text style={styles.sectionSubtitle}>
          {selectedArray.length > 0 ? `คุณเลือก ${selectedArray.length} รายการ แตะ ✕ เพื่อลบ` : 'ยังไม่มีรายการ กดปุ่มด้านล่างเพื่อเพิ่ม'}
        </Text>

        {selectedArray.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {grouped.map((group) => (
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
                        onPress={() => handleRemoveFood(displayName)}
                        style={[styles.chip, styles.summaryChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, styles.summaryChipTextSelected]}>{displayName}</Text>
                        <Ionicons name='close-circle' size={14} color='#888888' />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openSelector}>
          <Ionicons name='add-circle-outline' size={22} color={ORANGE} />
          <Text style={styles.addBtnText}>{selectedArray.length > 0 ? 'แก้ไข' : 'เพิ่มวัตถุดิบที่ไม่ชอบ'}</Text>
        </TouchableOpacity>

        {selectedArray.length > 0 && (
          <TouchableOpacity style={styles.editBtn} onPress={handleClearAll}>
            <Ionicons name='trash-outline' size={20} color='#666' />
            <Text style={styles.editBtnText}>ล้างทั้งหมด</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color='#fff' /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Selector Modal (Mode 2) */}
      <Modal visible={showSelectorModal} animationType='slide' presentationStyle='pageSheet'>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' }}>
            <TouchableOpacity onPress={() => { setShowSelectorModal(false); setModalSearchQuery(''); }}>
              <Ionicons name='close' size={26} color='#222' />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontFamily: FONT_BOLD, color: '#222' }}>เลือกวัตถุดิบที่ไม่ชอบ</Text>
            <View style={{ width: 26 }} />
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={styles.searchWrap}>
              <Ionicons name='search' size={18} color='#999' />
              <TextInput style={styles.searchInput} placeholder='ค้นหา...' placeholderTextColor='#999' value={modalSearchQuery} onChangeText={setModalSearchQuery} />
              {modalSearchQuery.length > 0 && (<TouchableOpacity onPress={() => setModalSearchQuery('')}><Ionicons name='close-circle' size={18} color='#999' /></TouchableOpacity>)}
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
            {hierarchyLoading ? (<ActivityIndicator size='large' color={ORANGE} style={{ marginTop: 40 }} />)
            : filteredHierarchy.length === 0 ? (
              <View style={styles.emptyContainer}><Ionicons name='search-outline' size={48} color='#E0E0E0' /><Text style={styles.emptyText}>ไม่พบรายการ</Text></View>
            ) : (
              filteredHierarchy.map((cat) => {
                const isOpen = expandedT1.has(cat.id);
                const cnt = countSelectedInT1(cat);
                return (
                  <View key={cat.id} style={[styles.categoryCard, isOpen && styles.categoryCardExpanded]}>
                    <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleT1(cat.id)} activeOpacity={0.7}>
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={styles.categoryEmoji}>{cat.emoji || '📦'}</Text>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        {cnt > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{cnt}</Text></View>}
                      </View>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color='#999' />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={styles.subCategoryArea}>
                        {cat.subCategories.map((sub) => {
                          const isSubOpen = expandedT2.has(sub.id);
                          const subCnt = countSelectedInT2(sub);
                          return (
                            <View key={sub.id} style={styles.subCategoryCard}>
                              <TouchableOpacity style={styles.subCategoryHeader} onPress={() => toggleT2(sub.id)} activeOpacity={0.7}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <Text style={styles.subCategoryName}>{sub.name}</Text>
                                  {subCnt > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{subCnt}</Text></View>}
                                </View>
                                <Ionicons name={isSubOpen ? 'chevron-up' : 'chevron-down'} size={16} color='#999' />
                              </TouchableOpacity>
                              {isSubOpen && (
                                <View style={styles.chipContainer}>
                                  {sub.items.map((item) => {
                                    const sel = modalSelected.has(item.name);
                                    return (
                                      <TouchableOpacity key={item.id} style={[styles.chip, sel ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleFood(item.name)} activeOpacity={0.7}>
                                        <Text style={[styles.chipText, sel ? styles.chipTextSelected : styles.chipTextUnselected]}>{item.name}</Text>
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
          {/* Selected summary + Bottom Buttons */}
          <View style={styles.selectedStrip}>
            <Text style={styles.selectedStripTitle}>รายการที่คุณเลือก ({modalSelected.size})</Text>
            {modalSelected.size === 0 ? (<Text style={styles.noneText}>ยังไม่มีรายการ</Text>) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 60 }} contentContainerStyle={{ gap: 6 }}>
                {Array.from(modalSelected).map((item) => (
                  <TouchableOpacity key={`modal-sel-${item}`} onPress={() => toggleFood(item)} style={[styles.chip, styles.summaryChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} activeOpacity={0.7}>
                    <Text style={[styles.chipText, styles.summaryChipTextSelected]}>{item}</Text>
                    <Ionicons name='close-circle' size={14} color='#888888' />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={() => { if (modalSelected.size > 0) { Alert.alert('ล้างทั้งหมด', 'ต้องการยกเลิกการเลือกทั้งหมดหรือไม่?', [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'ล้าง', style: 'destructive', onPress: () => setModalSelected(new Set()) }]); } }} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>ยกเลิกทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmSelector} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
