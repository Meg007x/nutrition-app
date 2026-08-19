import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserPlan, deletePlan as apiDeletePlan, replaceMeal, deleteMeal, searchFoods, toggleMealStatus, getTodayDate, getTodayPlan, getEatenKcal, getTargetKcal, getEatenCount, type DailyPlan, type SearchResult } from "../../services/mealPlanService";

const ORANGE = "#F29913";
function parseDate(ds: string) { const [y, m, d] = ds.split("-").map(Number); return new Date(y, m - 1, d); }
function fmtShort(ds: string) { const d = parseDate(ds); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; }
function thaiDay(ds: string) { return ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][parseDate(ds).getDay()]; }
function thaiDate(ds: string) { const d = parseDate(ds); const mo = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]; return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543}`; }
function mealIcon(mt: string) { const t = mt.toLowerCase(); if (t.includes("breakfast") || t.includes("เช้า")) return "sunny-outline"; if (t.includes("lunch") || t.includes("กลางวัน")) return "partly-sunny-outline"; if (t.includes("dinner") || t.includes("เย็น")) return "moon-outline"; return "restaurant-outline"; }

export default function PlanScreen() {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "full">("today");
  const [dayIdx, setDayIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selSlot, setSelSlot] = useState<{ planId: string; date: string; idx: number; name: string } | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function getUid() {
    for (const k of ["user_id", "userId"]) { const v = await AsyncStorage.getItem(k); if (v) return v; }
    const raw = await AsyncStorage.getItem("currentUser");
    if (raw) { const o = JSON.parse(raw); if (o?.user_id) return String(o.user_id); }
    return null;
  }

  async function loadPlan() {
    try {
      setLoading(true);
      const uid = await getUid();
      if (!uid) { setPlans([]); setHasPlan(false); return; }
      const data = await getUserPlan(uid);
      setHasPlan(data.hasPlan === true);
      const p = Array.isArray(data.plans) ? data.plans : [];
      setPlans(p);
      const ti = p.findIndex((x: DailyPlan) => x.date === getTodayDate());
      if (ti >= 0) setDayIdx(ti);
    } catch (e: any) { setHasPlan(false); Alert.alert("โหลดแผนไม่สำเร็จ", e?.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { loadPlan(); }, []));

  const todayPlan = useMemo(() => getTodayPlan(plans), [plans]);
  const eatenKcal = useMemo(() => getEatenKcal(todayPlan), [todayPlan]);
  const targetKcal = useMemo(() => getTargetKcal(todayPlan), [todayPlan]);
  const eatenCount = useMemo(() => getEatenCount(todayPlan), [todayPlan]);
  const selDay = plans[dayIdx] || null;

  function confirmDel(plan: DailyPlan) {
    Alert.alert("ลบแผนอาหาร", `ต้องการลบแผน ${plan.plan_id}?`, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: () => handleDeletePlan(plan.plan_id) },
    ]);
  }

  async function handleDeletePlan(planId: string) {
    try { await apiDeletePlan(planId); setPlans((p) => p.filter((x) => x.plan_id !== planId)); Alert.alert("สำเร็จ", "ลบแผนอาหารแล้ว"); }
    catch (e: any) { Alert.alert("ลบไม่สำเร็จ", e?.message); }
  }

  async function handleToggle(pi: string, dt: string, si: number, cs: string) {
    try {
      const ns = cs === "eaten" ? "pending" : "eaten";
      await toggleMealStatus(pi, dt, si, ns);
      setPlans((p) => p.map((pl) => {
        if (pl.plan_id === pi && pl.date === dt) { const s = [...pl.slots]; s[si] = { ...s[si], status: ns }; return { ...pl, slots: s }; }
        return pl;
      }));
    } catch (e: any) { Alert.alert("อัปเดตไม่สำเร็จ", e?.message); }
  }

  function openModal(pi: string, dt: string, si: number, sn: string) {
    setSelSlot({ planId: pi, date: dt, idx: si, name: sn });
    setSearchQ(""); setSearchRes([]); setShowModal(true);
  }

  function onSearch(text: string) {
    setSearchQ(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) { setSearchRes([]); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try { const d = await searchFoods(text.trim(), 15); setSearchRes(d.foods || []); }
      catch { setSearchRes([]); } finally { setSearching(false); }
    }, 400);
  }

  async function doReplace(foodId: string) {
    if (!selSlot) return;
    try { await replaceMeal(selSlot.planId, selSlot.date, selSlot.idx, foodId); Alert.alert("สำเร็จ", "แทนที่มื้ออาหารแล้ว"); setShowModal(false); setSelSlot(null); await loadPlan(); }
    catch (e: any) { Alert.alert("แทนที่ไม่สำเร็จ", e?.message); }
  }

  function doDeleteMeal(pi: string, dt: string, si: number) {
    Alert.alert("ลบมื้ออาหาร", "ต้องการลบมื้อนี้?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบ", style: "destructive", onPress: async () => {
        try { await deleteMeal(pi, String(si), dt); Alert.alert("สำเร็จ", "ลบมื้ออาหารแล้ว"); await loadPlan(); }
        catch (e: any) { Alert.alert("ลบไม่สำเร็จ", e?.message); }
      }},
    ]);
  }

  function doScanReplace() {
    if (!selSlot) return;
    setShowModal(false);
    router.push({ pathname: "/food-scan", params: { replaceTarget: JSON.stringify(selSlot) } });
  }

  // ===== LOADING =====
  if (loading && plans.length === 0) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}><Text style={st.headerTitle}>แผนอาหาร</Text></View>
        <View style={st.center}><ActivityIndicator size="large" color={ORANGE} /><Text style={{ marginTop: 12, color: "#777" }}>กำลังโหลด...</Text></View>
      </SafeAreaView>
    );
  }

  // ===== NO PLAN =====
  if (!hasPlan || plans.length === 0) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}><Text style={st.headerTitle}>แผนอาหาร</Text></View>
        <View style={st.center}>
          <Ionicons name="nutrition-outline" size={64} color={ORANGE} />
          <Text style={st.emptyTitle}>ยังไม่มีแผนอาหาร</Text>
          <Text style={st.emptyText}>เริ่มต้นสร้างแผนอาหาร 7 วัน{"\n"}เพื่อสุขภาพที่ดีของคุณ</Text>
          <TouchableOpacity style={st.createBtn} onPress={() => router.push("/create-plan/step1")} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={st.createBtnText}>สร้างแผนอาหาร</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== ACTIVE PLAN =====
  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>แผนอาหาร</Text>
        <TouchableOpacity onPress={() => router.push("/create-plan/step1")}><Ionicons name="add-circle-outline" size={26} color="#fff" /></TouchableOpacity>
      </View>
      <View style={st.tabBar}>
        <TouchableOpacity style={[st.tab, activeTab === "today" && st.tabActive]} onPress={() => setActiveTab("today")}><Text style={[st.tabText, activeTab === "today" && st.tabTextActive]}>วันนี้</Text></TouchableOpacity>
        <TouchableOpacity style={[st.tab, activeTab === "full" && st.tabActive]} onPress={() => setActiveTab("full")}><Text style={[st.tabText, activeTab === "full" && st.tabTextActive]}>แผนทั้งหมด</Text></TouchableOpacity>
      </View>

      {activeTab === "today" ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPlan(); }} />}>
          <View style={st.summaryCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="flame-outline" size={22} color={ORANGE} /><Text style={{ fontSize: 16, fontWeight: "bold" }}>{thaiDate(todayPlan?.date || getTodayDate())}</Text></View>
            <View style={{ marginTop: 12 }}>
              <View style={st.progressBar}><View style={[st.progressFill, { width: targetKcal > 0 ? `${Math.min(100, (eatenKcal / targetKcal) * 100)}%` : "0%" }]} /></View>
              <Text style={{ marginTop: 4, fontSize: 13, color: "#777", textAlign: "right" }}>{eatenKcal} / {targetKcal} kcal</Text>
            </View>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              {[{ l: "Protein", v: todayPlan?.daily_target_summary?.protein_g ?? 0, c: "#3B82F6" }, { l: "Carbs", v: todayPlan?.daily_target_summary?.carb_g ?? 0, c: "#F59E0B" }, { l: "Fat", v: todayPlan?.daily_target_summary?.fat_g ?? 0, c: "#EF4444" }].map((m) => (
                <View key={m.l} style={{ flex: 1, alignItems: "center" }}><Text style={{ fontSize: 12, color: "#999" }}>{m.l}</Text><Text style={{ fontSize: 16, fontWeight: "bold", color: m.c, marginTop: 2 }}>{m.v}g</Text></View>
              ))}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22A06B" }} /><Text style={{ marginLeft: 8, fontSize: 13, color: "#22A06B", fontWeight: "600" }}>กินแล้ว {eatenCount}/{todayPlan?.slots.length || 0} มื้อ</Text></View>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "bold", marginBottom: 12 }}>มื้ออาหารวันนี้</Text>
          {todayPlan?.slots.map((slot, idx) => {
            const isE = slot.status === "eaten"; const hasF = !!slot.main_food;
            return (
              <View key={idx} style={st.mealCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name={mealIcon(slot.meal_type) as any} size={20} color={ORANGE} />
                  <View style={{ flex: 1 }}><Text style={{ fontSize: 13, color: "#999", fontWeight: "600" }}>{slot.slot_name}</Text><Text style={{ fontSize: 15, fontWeight: "bold", color: "#333", marginTop: 2 }}>{slot.main_food?.name || "ไม่มีเมนู"}</Text></View>
                  {hasF && <TouchableOpacity onPress={() => handleToggle(todayPlan.plan_id, todayPlan.date, idx, slot.status || "pending")}><Ionicons name={isE ? "checkmark-circle" : "ellipse-outline"} size={26} color={isE ? "#22A06B" : "#ccc"} /></TouchableOpacity>}
                </View>
                {hasF && slot.main_food && <Text style={{ marginTop: 8, fontSize: 14, color: ORANGE, fontWeight: "bold" }}>{slot.main_food.kcal || 0} kcal</Text>}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={st.actionBtn} onPress={() => openModal(todayPlan.plan_id, todayPlan.date, idx, slot.slot_name)}><Ionicons name="swap-horizontal-outline" size={16} color={ORANGE} /><Text style={{ fontSize: 13, color: ORANGE, fontWeight: "600" }}>เปลี่ยน</Text></TouchableOpacity>
                  {hasF && <TouchableOpacity style={st.actionBtn} onPress={() => doDeleteMeal(todayPlan.plan_id, todayPlan.date, idx)}><Ionicons name="trash-outline" size={16} color="#EF4444" /><Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "600" }}>ลบ</Text></TouchableOpacity>}
                </View>
              </View>
            );
          })}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={st.outlineBtn} onPress={() => setActiveTab("full")}><Ionicons name="calendar-outline" size={18} color={ORANGE} /><Text style={{ fontSize: 15, color: ORANGE, fontWeight: "600" }}>ดูแผน 7 วัน</Text></TouchableOpacity>
            <TouchableOpacity style={st.dangerBtn} onPress={() => { const f = plans[0]; if (f) confirmDel(f); }}><Ionicons name="trash-outline" size={18} color="#fff" /><Text style={{ fontSize: 15, color: "#fff", fontWeight: "600" }}>ลบแผน</Text></TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPlan(); }} />}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
            {plans.map((pl, i) => (
              <TouchableOpacity key={pl.date} style={[st.dayTab, dayIdx === i && st.dayTabActive]} onPress={() => setDayIdx(i)}>
                <Text style={[{ fontSize: 13, fontWeight: "800", color: "#333" }, dayIdx === i && { color: "#fff" }]}>{thaiDay(pl.date)}</Text>
                <Text style={[{ fontSize: 11, color: "#999", marginTop: 2 }, dayIdx === i && { color: "#fff" }]}>{fmtShort(pl.date)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selDay && (
            <>
              <Text style={{ fontSize: 17, fontWeight: "bold", marginBottom: 12 }}>{thaiDate(selDay.date)}</Text>
              {selDay.slots.map((slot, idx) => {
                const isE = slot.status === "eaten"; const hasF = !!slot.main_food;
                return (
                  <View key={idx} style={st.mealCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Ionicons name={mealIcon(slot.meal_type) as any} size={20} color={ORANGE} />
                      <View style={{ flex: 1 }}><Text style={{ fontSize: 13, color: "#999", fontWeight: "600" }}>{slot.slot_name}</Text><Text style={{ fontSize: 15, fontWeight: "bold", color: "#333", marginTop: 2 }}>{slot.main_food?.name || "ไม่มีเมนู"}</Text></View>
                      {hasF && <TouchableOpacity onPress={() => handleToggle(selDay.plan_id, selDay.date, idx, slot.status || "pending")}><Ionicons name={isE ? "checkmark-circle" : "ellipse-outline"} size={26} color={isE ? "#22A06B" : "#ccc"} /></TouchableOpacity>}
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <TouchableOpacity style={st.actionBtn} onPress={() => openModal(selDay.plan_id, selDay.date, idx, slot.slot_name)}><Ionicons name="swap-horizontal-outline" size={16} color={ORANGE} /><Text style={{ fontSize: 13, color: ORANGE, fontWeight: "600" }}>เปลี่ยน</Text></TouchableOpacity>
                      {hasF && <TouchableOpacity style={st.actionBtn} onPress={() => doDeleteMeal(selDay.plan_id, selDay.date, idx)}><Ionicons name="trash-outline" size={16} color="#EF4444" /><Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "600" }}>ลบ</Text></TouchableOpacity>}
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <TouchableOpacity style={[st.dangerBtn, { flex: 1, marginTop: 24 }]} onPress={() => { const f = plans[0]; if (f) confirmDel(f); }}>
            <Ionicons name="trash-outline" size={20} color="#fff" /><Text style={{ fontSize: 16, color: "#fff", fontWeight: "bold" }}>ลบแผนอาหารทั้งหมด</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* MEAL CUSTOMIZATION MODAL */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "bold" }}>เปลี่ยน {selSlot?.name || "มื้ออาหาร"}</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 14, backgroundColor: "#f5f5f5", borderRadius: 12, height: 46, gap: 8 }}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput style={{ flex: 1, fontSize: 15, color: "#333" }} placeholder="ค้นหาอาหาร เช่น อกไก่..." placeholderTextColor="#aaa" value={searchQ} onChangeText={onSearch} autoFocus />
            {searchQ.length > 0 && <TouchableOpacity onPress={() => onSearch("")}><Ionicons name="close-circle" size={20} color="#999" /></TouchableOpacity>}
          </View>
          <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 }}>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FFF8E8" }} onPress={doScanReplace}>
              <Ionicons name="camera-outline" size={22} color={ORANGE} /><Text style={{ fontSize: 14, fontWeight: "600", color: ORANGE }}>สแกนอาหาร</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: "#FEF2F2" }} onPress={() => { if (selSlot) doDeleteMeal(selSlot.planId, selSlot.date, selSlot.idx); }}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" /><Text style={{ fontSize: 14, fontWeight: "600", color: "#EF4444" }}>ลบมื้อนี้</Text>
            </TouchableOpacity>
          </View>
          {searching && <ActivityIndicator size="small" color={ORANGE} style={{ marginTop: 20 }} />}
          <FlatList data={searchRes} keyExtractor={(item) => item._id} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
            ListEmptyComponent={searchQ.length > 0 && !searching ? (<View style={{ alignItems: "center", paddingTop: 60 }}><Ionicons name="search-outline" size={40} color="#ddd" /><Text style={{ marginTop: 12, color: "#ccc" }}>ไม่พบอาหาร</Text></View>) : searchQ.length === 0 ? (<View style={{ alignItems: "center", paddingTop: 60 }}><Ionicons name="restaurant-outline" size={40} color="#ddd" /><Text style={{ marginTop: 12, color: "#ccc" }}>พิมพ์ชื่ออาหารเพื่อค้นหา</Text></View>) : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", gap: 12 }} onPress={() => doReplace(item._id)} activeOpacity={0.7}>
                {item.image ? <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 10 }} /> : <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }}><Ionicons name="fast-food-outline" size={24} color="#ccc" /></View>}
                <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "600", color: "#333" }} numberOfLines={1}>{item.name}</Text>{item.name_en ? <Text style={{ fontSize: 12, color: "#999", marginTop: 1 }} numberOfLines={1}>{item.name_en}</Text> : null}<Text style={{ fontSize: 13, color: ORANGE, fontWeight: "600", marginTop: 2 }}>{item.nutrition_per_portion?.kcal || 0} kcal</Text></View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}


const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { height: 56, backgroundColor: "#F29913", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", marginTop: 20, color: "#333" },
  emptyText: { fontSize: 15, color: "#999", textAlign: "center", marginTop: 10, lineHeight: 22 },
  createBtn: { marginTop: 30, backgroundColor: "#F29913", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, flexDirection: "row", alignItems: "center", gap: 8 },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: ORANGE },
  tabText: { fontSize: 15, color: "#999", fontWeight: "600" },
  tabTextActive: { color: ORANGE, fontWeight: "bold" },
  summaryCard: { backgroundColor: "#FFF8E8", borderRadius: 16, padding: 16, marginBottom: 16 },
  progressBar: { height: 10, backgroundColor: "#eee", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: ORANGE, borderRadius: 5 },
  mealCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 14, padding: 14, marginBottom: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#f8f8f8" },
  outlineBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: ORANGE },
  dangerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#EF4444" },
  dayTab: { width: 58, height: 62, borderRadius: 12, borderWidth: 1, borderColor: "#eee", justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  dayTabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
});
