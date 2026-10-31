import { StyleSheet } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก

export const ORANGE = "#F5A400";

export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_2 = "#DF9226";

// 2. ตัวแปรฟอนต์
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BG 
},
  headerBar: {
     paddingVertical: 16,
     alignItems: "center",
     backgroundColor: ORANGE },

  headerText: {
    fontSize: 18,
    color: "#FFF",
    fontFamily: FONT_BOLD },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 24, flexGrow: 1 },
  stepTitle: { fontSize: 22, color: "#222", marginBottom: 16, fontFamily: FONT_BOLD },
  progressTrack: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 4, marginBottom: 24, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: ORANGE, borderRadius: 4 },
  subtitle: { fontSize: 16, color: "#444", marginBottom: 16, fontFamily: FONT_BOLD },
  
  // สไตล์หน้าหลัก
  categoriesWrap: { gap: 12 },
  categoryCard: { backgroundColor: "#FFF", borderRadius: 14, borderWidth: 1, borderColor: "#E8E8E8", overflow: "hidden" },
  categoryCardExpanded: { borderColor: ORANGE },
  categoryRow: { flexDirection: "row", alignItems: "center", minHeight: 54, paddingVertical: 8, paddingLeft: 16, paddingRight: 8, backgroundColor: "#FFF" },
  categoryExpandButton: { flex: 1, flexDirection: "row", alignItems: "center", minHeight: 44 },
  categorySelectAll: { alignItems: "center", justifyContent: "center", marginLeft: 8 },
  categoryChevronButton: { alignItems: "center", justifyContent: "center", width: 30, minHeight: 44, marginLeft: 4 },
  categoryEmoji: { fontSize: 22, marginRight: 10 },
  categoryText: { flex: 1, fontSize: 16, color: "#292621", fontFamily: FONT_BOLD },
  badge: { backgroundColor: "#FFF1D6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  badgeText: { color: "#9A6000", fontSize: 11, fontFamily: FONT_BOLD },
  
  // สไตล์หน้าย่อย (Nested Screen)
  subScreenHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backIconBtn: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  backIconText: { fontSize: 16, color: "#333", marginLeft: 4, fontFamily: FONT_BOLD },
  subScreenTitle: { fontSize: 20, color: "#222", fontFamily: FONT_BOLD },
  subListWrapOuter: { backgroundColor: "#FFF8ED", borderTopWidth: 1, borderTopColor: "#EEE9E0", paddingTop: 6, paddingBottom: 10, paddingHorizontal: 12 },
  subItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: "#FFF" },
  subItemRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  subItemText: { fontSize: 16, color: "#333", marginLeft: 4, fontFamily: FONT_BOLD },

  // ─── Sub-Category Card (Tier 2 container) ───
  subCategoryCard: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#EEE5D8", marginBottom: 8, overflow: "hidden" },
  subCategoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, paddingHorizontal: 12 },
  subCategoryTitle: { flex: 1, fontSize: 14, fontFamily: FONT_BOLD, color: "#60491F" },
  subCategoryHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  // ─── Tier 3 Ingredient Chips ───
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipUnselected: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  chipText: { fontSize: 14, fontFamily: FONT_REGULAR },
  chipTextSelected: { color: "#FFFFFF", fontFamily: FONT_BOLD },
  chipTextUnselected: { color: "#666666" },
  emptyText: { padding: 20, textAlign: "center", fontSize: 16, color: "#666", backgroundColor: "#FFF", fontFamily: FONT_REGULAR },
  doneBtn: { backgroundColor: "#222", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  doneBtnText: { color: "#FFF", fontSize: 16, fontFamily: FONT_BOLD },

  searchToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },

  searchToggleText: {
    fontSize: 14,
    color: "#333",
    fontFamily: FONT_BOLD,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    fontFamily: FONT_REGULAR,
    paddingVertical: 4,
  },
  searchResults: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF8ED",
    borderRadius: 12,
  },

  showMoreBtn: {
    padding: 14,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
  },

  showMoreText: {
    fontSize: 14,
    color: ORANGE,
    fontFamily: FONT_BOLD,
  },

  customInputRow: { flexDirection: "row", padding: 12, backgroundColor: "#FAFAFA", borderTopWidth: 1, borderTopColor: "#EFEFEF" },
  customInput: { flex: 1, height: 40, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, paddingHorizontal: 12, fontSize: 15, fontFamily: FONT_REGULAR },
  customAddBtn: { marginLeft: 8, backgroundColor: ORANGE, justifyContent: "center", paddingHorizontal: 16, borderRadius: 8 },
  customAddBtnText: { color: "#FFF", fontSize: 14, fontFamily: FONT_BOLD },

  summaryBox: { marginTop: 16, backgroundColor: "#FFF8EC", borderRadius: 14, borderWidth: 1, borderColor: "#F0D3A3", padding: 14 },
  summaryTitle: { fontSize: 15, color: "#6B5A3D", marginBottom: 6, fontFamily: FONT_BOLD },
  summaryText: { fontSize: 14, color: "#333", lineHeight: 20, fontFamily: FONT_BOLD },
  summaryChipWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  summaryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF4DD", borderWidth: 1, borderColor: "#F3D299", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  summaryChipText: { color: "#8A5A00", fontSize: 14, fontFamily: FONT_BOLD },
  summaryChipRemove: { marginLeft: 8, color: "#C96E00", fontSize: 14, fontFamily: FONT_BOLD },

  spacer: { minHeight: 40, flex: 1 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  backButton: { width: 120, borderWidth: 1.8, borderColor: "#333", borderRadius: 15, paddingVertical: 15, backgroundColor: "#FFF", alignItems: "center" },
  backText: { color: "#222", fontSize: 16, fontFamily: FONT_BOLD },
  nextButton: { width: 120, backgroundColor: ORANGE, borderRadius: 15, paddingVertical: 15, alignItems: "center", shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextText: { color: "#FFF", fontSize: 16, fontFamily: FONT_BOLD },
});

export default styles;
