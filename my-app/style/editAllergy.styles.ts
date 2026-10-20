import { StyleSheet } from "react-native";

export const ORANGE = "#DF9226";
export const ORANGE_LIGHT = "#EBA032";
export const BG = "#F5F5F5";
export const DARK = "#C67A1A";

export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, position: "relative" },
  headerBar: { backgroundColor: ORANGE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  backIcon: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontFamily: FONT_BOLD },
  headerRight: { width: 32 },
  content: { padding: 16, flexGrow: 1 },
  sectionTitle: { fontSize: 17, color: "#222222", fontFamily: FONT_BOLD, marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, color: "#999999", fontFamily: FONT_REGULAR, marginBottom: 16, marginTop: -6 },
  categoryCard: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#E8E8E8", marginBottom: 10, overflow: "hidden" },
  categoryCardExpanded: { borderColor: ORANGE },
  categoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  categoryEmoji: { fontSize: 22 },
  categoryName: { fontSize: 15, fontFamily: FONT_BOLD, color: "#222222" },
  categoryBadge: { backgroundColor: "#FFF8ED", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6, borderWidth: 1, borderColor: "#F0E0C8" },
  categoryBadgeText: { fontSize: 11, fontFamily: FONT_BOLD, color: ORANGE },
  subCategoryArea: { backgroundColor: "#FFF8ED", paddingTop: 6, paddingBottom: 10, paddingHorizontal: 12 },
  subCategoryCard: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#F0E0C8", marginBottom: 8, overflow: "hidden" },
  subCategoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  subCategoryName: { fontSize: 14, fontFamily: FONT_BOLD, color: DARK },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, backgroundColor: "#FFFFFF", borderColor: "#DCDCDC" },
  chipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipUnselected: { backgroundColor: "#FFFFFF", borderColor: "#DCDCDC" },
  chipText: { fontSize: 14, fontFamily: FONT_REGULAR, color: "#000000" },
  chipTextSelected: { color: "#FFFFFF", fontFamily: FONT_BOLD },
  chipTextUnselected: { color: "#000000" },
  
  // ─── Selected Strip / Summary Section (สไตล์มินิมอลแบบ step6-2) ───
  selectedStrip: { backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E8E8E8", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  selectedStripTitle: { fontSize: 13, color: "#333333", fontFamily: FONT_BOLD, marginBottom: 8 },
  
  // ก้อนวัตถุดิบที่แพ้ (มินิมอล: พื้นหลังขาว ตัวหนังสือดำ ขอบเทาอ่อน)
  selectedChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#DCDCDC" },
  selectedChipText: { fontSize: 13, color: "#000000", fontFamily: FONT_REGULAR },
  
  bottomBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E8E8E8" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0E0E0", backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 15, color: "#999999", fontFamily: FONT_BOLD },
  confirmBtn: { flex: 1.5, paddingVertical: 14, borderRadius: 12, backgroundColor: ORANGE, alignItems: "center", justifyContent: "center", shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  confirmBtnText: { fontSize: 15, color: "#FFFFFF", fontFamily: FONT_BOLD },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: ORANGE, backgroundColor: "#FFFFFF", marginTop: 12 },
  addBtnText: { fontSize: 15, color: ORANGE, fontFamily: FONT_BOLD },
  saveButton: { backgroundColor: ORANGE, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 20, marginBottom: 12, shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  saveButtonText: { color: "#FFFFFF", fontSize: 18, fontFamily: FONT_BOLD },
  toast: { position: "absolute", top: 70, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, zIndex: 999, shadowColor: "#000000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 5 },
  toastSuccess: { backgroundColor: "#22A06B" },
  toastError: { backgroundColor: "#E53935" },
  toastText: { color: "#FFFFFF", fontSize: 14, fontFamily: FONT_BOLD },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 15, color: "#999999", fontFamily: FONT_REGULAR, marginTop: 12, textAlign: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E8E8E8", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#222222", fontFamily: FONT_REGULAR },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noneText: { fontSize: 13, color: "#999999", fontFamily: FONT_REGULAR, paddingVertical: 4 },
  categoryGroupHeader: { fontSize: 13, color: DARK, fontFamily: FONT_BOLD, marginBottom: 6, marginTop: 8 },

  // ─── Summary Category Cards (โครงสร้างการ์ดมินิมอลแบบ step6-2) ───
  summaryCategoryCard: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#E8E8E8", marginBottom: 12, overflow: "hidden" },
  summaryCategoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#FFF8ED", borderBottomWidth: 1, borderBottomColor: "#F0E0C8" },
  summaryCategoryEmoji: { fontSize: 20 },
  summaryCategoryName: { fontSize: 14, fontFamily: FONT_BOLD, color: "#333333", flex: 1 },
  summaryCountBadge: { backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  summaryCountBadgeText: { fontSize: 11, fontFamily: FONT_BOLD, color: ORANGE },
  
  // โทนสีแยกหัวข้อตามประเภทหมวดหมู่
  headerVeg: { backgroundColor: "#E8F5E9", borderBottomColor: "#C8E6C9" },
  headerCondiment: { backgroundColor: "#FFF3E0", borderBottomColor: "#FFE0B2" },
  headerMeat: { backgroundColor: "#FFEBEE", borderBottomColor: "#FFCDD2" },
  headerOther: { backgroundColor: "#F5F5F5", borderBottomColor: "#E0E0E0" },

  // พื้นที่ใส่ชิปในการ์ดสรุป
  summaryChipsArea: { padding: 12, flexDirection: "row", flexWrap: "wrap", gap: 8, backgroundColor: "#FFFFFF" },
  summaryChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#DCDCDC" },
  summaryChipText: { fontSize: 13, color: "#000000", fontFamily: FONT_REGULAR },
  summaryChipSelected: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1.5, borderColor: "#DCDCDC" },
  summaryChipTextSelected: { color: "#000000", fontFamily: FONT_REGULAR },
});