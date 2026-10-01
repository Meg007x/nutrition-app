import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, Platform, TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { styles, ORANGE } from '@/style/editAllergy.styles';
import { BASE_URL, API_BASE_URL } from '../../constants/config';
import { Brand } from '../../constants/theme';

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; subCategories: Tier2Category[] };

export default function EditAllergyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tier3Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => { loadUserProfile(); }, []);

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
        const allergies = json.data.allergies || {};
        const allItems: string[] = [
          ...(allergies.veg || []),
          ...(allergies.condiment || []),
          ...(allergies.meat || []),
          ...(allergies.other || []),
        ];
        setSelectedAllergies(allItems);
      }
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const loadHierarchy = async () => {
    setHierarchyLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
      const json = await response.json();
      if (json.success && json.data) setHierarchy(json.data);
    } catch (error) { console.error("Hierarchy error:", error); }
    finally { setHierarchyLoading(false); }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ingredients`);
      const json = await response.json();
      if (json.success && json.data) {
        const allItems: Tier3Item[] = [];
        Object.values(json.data).forEach((categoryItems: any) => {
          if (Array.isArray(categoryItems)) {
            categoryItems.forEach((item: any) => {
              if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) {
                allItems.push({ id: item._id, name: item.name });
              }
            });
          }
        });
        setSearchResults(allItems);
      }
    } catch (e) { console.error("Search error:", e); }
    finally { setSearching(false); }
  }, []);

  const addAllergy = (name: string) => {
    if (!selectedAllergies.includes(name)) setSelectedAllergies(prev => [...prev, name]);
  };

  const removeAllergy = async (name: string) => {
    setSelectedAllergies(prev => prev.filter(x => x !== name));
    if (currentUserId) {
      try {
        await fetch(`${BASE_URL}/api/users/allergies`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, itemName: name }),
        });
      } catch (e) { console.error("Delete error:", e); }
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/allergies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, allergies: selectedAllergies }),
      });
      const json = await response.json();
      if (response.ok && json.success) {
        showNotification("🎉 บันทึกสำเร็จ!", "success");
        setTimeout(() => router.back(), 1200);
      } else {
        showNotification(`❌ ${json.message}`, "error");
      }
    } catch (e) { showNotification("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์", "error"); }
    finally { setSaving(false); }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    if (hierarchy.length === 0) loadHierarchy();
  };

  const toggleT1 = (id: string) => setExpandedT1(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleT2 = (key: string) => setExpandedT2(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // Filter hierarchy based on modal search query
  const filteredHierarchy = modalSearchQuery.trim()
    ? hierarchy.map(t1 => ({
        ...t1,
        subCategories: t1.subCategories.map(t2 => ({
          ...t2,
          items: t2.items.filter(item =>
            item.name.toLowerCase().includes(modalSearchQuery.toLowerCase())
          ),
        })).filter(t2 => t2.items.length > 0),
      })).filter(t1 => t1.subCategories.length > 0)
    : hierarchy;

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={ORANGE} /></View>;
  }

  const r = router; // shortcut

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16, backgroundColor: toast.type === 'success' ? '#E8F5E9' : '#FFEBEE', borderColor: toast.type === 'success' ? '#4CAF50' : '#FF5252', borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row' as const, alignItems: 'center' as const, zIndex: 9999, elevation: 5 }}>
          <View style={{ marginRight: 10 }}>
            {toast.type === 'success' ? <Ionicons name="checkmark-circle" size={24} color="#2E7D32" /> : <Ionicons name="alert-circle" size={24} color="#C62828" />}
          </View>
          <Text style={{ fontFamily: 'NotoSansThaiBold', fontSize: 15, color: toast.type === 'success' ? '#2E7D32' : '#C62828', flex: 1 }}>{toast.message}</Text>
        </View>
      )}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => r.back()} style={styles.backIcon}><Ionicons name="chevron-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>อาหารที่แพ้</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' }}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, fontFamily: 'NotoSansThai' }} placeholder="ค้นหาวัตถุดิบที่แพ้..." placeholderTextColor="#999" value={searchQuery} onChangeText={handleSearch} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}><Ionicons name="close-circle" size={20} color="#999" /></TouchableOpacity>}
        </View>
        {searchQuery.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>ผลการค้นหา ({searchResults.length})</Text>
            {searching ? <ActivityIndicator size="small" color={ORANGE} /> : searchResults.length === 0 ? <Text style={{ color: '#999', fontSize: 14 }}>ไม่พบผลลัพธ์</Text> : searchResults.map((item) => {
              const isSel = selectedAllergies.includes(item.name);
              return (
                <TouchableOpacity key={item.id} style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: isSel ? ORANGE : '#E0E0E0' }} onPress={() => isSel ? removeAllergy(item.name) : addAllergy(item.name)}>
                  <Text style={{ fontSize: 16, color: '#333', fontFamily: 'NotoSansThaiBold' }}>{item.name}</Text>
                  {isSel ? <Ionicons name="checkmark-circle" size={24} color={ORANGE} /> : <Ionicons name="add-circle-outline" size={24} color="#999" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>อาหารที่แพ้ ({selectedAllergies.length})</Text>
          <TouchableOpacity onPress={openAddModal} style={{ flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'NotoSansThaiBold' }}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>
        {selectedAllergies.length === 0 ? (
          <View style={{ alignItems: 'center' as const, paddingVertical: 40 }}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#CCC" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 12 }}>ไม่มีรายการอาหารที่คุณแพ้</Text>
          </View>
        ) : selectedAllergies.map((item, index) => (
          <View key={`${item}-${index}`} style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' }}>
            <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF4DD', alignItems: 'center' as const, justifyContent: 'center' as const }}><Ionicons name="alert-circle" size={18} color={ORANGE} /></View>
              <Text style={{ fontSize: 16, color: '#333', fontFamily: 'NotoSansThaiBold' }}>{item}</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('ลบรายการ', `ต้องการลบ "${item}"?`, [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'ลบ', style: 'destructive', onPress: () => removeAllergy(item) }])} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={22} color="#E53935" />
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ flex: 1, minHeight: 40 }} />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>}
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Brand.primaryLight }}>
          {/* Modal Header */}
          <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: Brand.primary }}>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setModalSearchQuery(''); }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontFamily: 'NotoSansThaiBold', color: '#fff' }}>เพิ่มสิ่งที่แพ้</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setModalSearchQuery(''); }}>
              <Text style={{ fontSize: 16, fontFamily: 'NotoSansThaiBold', color: '#fff' }}>เสร็จ</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Count Banner */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Brand.primaryLight, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 }}>
            <Ionicons name="shield-checkmark" size={18} color={Brand.primary} />
            <Text style={{ fontSize: 14, color: Brand.primaryDark, fontFamily: 'NotoSansThaiBold' }}>เลือกแล้ว {selectedAllergies.length} รายการ</Text>
          </View>

          {/* Search Bar */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E0E0E0' }}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#222', fontFamily: 'NotoSansThai' }}
                placeholder="ค้นหาวัตถุดิบ..."
                placeholderTextColor="#AAA"
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {hierarchyLoading ? (
            <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
              <ActivityIndicator size="large" color={Brand.primary} />
              <Text style={{ marginTop: 12, color: '#999', fontFamily: 'NotoSansThai' }}>กำลังโหลด...</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {filteredHierarchy.length === 0 ? (
                <View style={{ alignItems: 'center' as const, paddingVertical: 40 }}>
                  <Ionicons name="search-outline" size={48} color="#CCC" />
                  <Text style={{ color: '#999', fontSize: 16, marginTop: 12, fontFamily: 'NotoSansThai' }}>
                    {modalSearchQuery.trim() ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีข้อมูล'}
                  </Text>
                </View>
              ) : filteredHierarchy.map((t1) => (
                <View key={t1.id} style={{ marginBottom: 8 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
                      paddingVertical: 14, paddingHorizontal: 16,
                      backgroundColor: '#fff', borderRadius: 14,
                      borderWidth: 1, borderColor: Brand.primaryLight,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
                    }}
                    onPress={() => toggleT1(t1.id)}
                  >
                    <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Brand.primaryLight, alignItems: 'center' as const, justifyContent: 'center' as const }}>
                        <Ionicons name="restaurant" size={18} color={Brand.primary} />
                      </View>
                      <Text style={{ fontSize: 16, fontFamily: 'NotoSansThaiBold', color: '#222' }}>{t1.name}</Text>
                    </View>
                    <Ionicons name={expandedT1.has(t1.id) ? 'chevron-up' : 'chevron-down'} size={22} color={Brand.primary} />
                  </TouchableOpacity>
                  {expandedT1.has(t1.id) && (
                    <View style={{ marginLeft: 8, marginTop: 4 }}>
                      {t1.subCategories.map((t2) => {
                        const t2Key = `${t1.id}__${t2.id}`;
                        return (
                          <View key={t2.id} style={{ marginBottom: 4 }}>
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
                                paddingVertical: 12, paddingHorizontal: 14,
                                backgroundColor: Brand.primaryLight, borderRadius: 10,
                              }}
                              onPress={() => toggleT2(t2Key)}
                            >
                              <Text style={{ fontSize: 15, fontFamily: 'NotoSansThaiBold', color: Brand.primaryDark }}>{t2.name}</Text>
                              <Ionicons name={expandedT2.has(t2Key) ? 'chevron-up' : 'chevron-down'} size={20} color={Brand.primary} />
                            </TouchableOpacity>
                            {expandedT2.has(t2Key) && t2.items.map((item) => {
                              const isSel = selectedAllergies.includes(item.name);
                              return (
                                <TouchableOpacity
                                  key={item.id}
                                  style={{
                                    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
                                    paddingVertical: 10, paddingHorizontal: 24,
                                    backgroundColor: isSel ? Brand.primaryLight : '#fff',
                                    borderRadius: 8, marginTop: 4,
                                    borderWidth: 1, borderColor: isSel ? Brand.primary : '#F0F0F0',
                                  }}
                                  onPress={() => isSel ? removeAllergy(item.name) : addAllergy(item.name)}
                                >
                                  <Text style={{ fontSize: 15, color: isSel ? Brand.primaryDark : '#333', fontFamily: 'NotoSansThai' }}>{item.name}</Text>
                                  {isSel
                                    ? <Ionicons name="checkmark-circle" size={20} color={Brand.primary} />
                                    : <Ionicons name="add-circle-outline" size={20} color="#CCC" />
                                  }
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}