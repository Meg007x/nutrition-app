import { StyleSheet } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const DARK = "#C67A1A";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";

// 2. ตัวแปรฟอนต์
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  
  headerBar: {
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  backIcon: {
    padding: 4,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  headerRight: {
    width: 32,
  },
  
  scroll: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  
  stepTitle: {
    fontSize: 26,
    color: "#111",
    fontFamily: FONT_BOLD,
  },
  
  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },
  
  progressFill: {
    width: "75%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 8,
  },
  
  subtitle: {
    marginTop: 24,
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    fontFamily: FONT_BOLD,
  },
  
  dropdownWrapper: {
    marginBottom: 16,
  },
  
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  emojiIcon: {
    fontSize: 22,
  },
  
  dropdownText: {
    fontSize: 18,
    color: "#FFF",
    marginLeft: 12,
    fontFamily: FONT_BOLD,
  },
  
  listContainer: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: -12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  
  listItemText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_REGULAR,
  },
  
  customInputRowInList: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  
  customInputInList: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
    fontFamily: FONT_REGULAR,
  },
  
  addButtonInList: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  
  addButtonTextInList: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  
  legacyCustomSection: {
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  
  legacyCustomTitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
    fontFamily: FONT_BOLD,
  },
  
  customChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4DD",
    borderWidth: 1,
    borderColor: "#F3D299",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  
  customChipText: {
    color: "#8A5A00",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  
  customChipRemove: {
    marginLeft: 8,
    color: "#C96E00",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  
  summaryBox: {
    marginTop: 8,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 14,
  },
  
  summaryTitle: {
    fontSize: 15,
    color: "#6B5A3D",
    marginBottom: 6,
    fontFamily: FONT_BOLD,
  },
  
  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: FONT_BOLD,
  },

  // Hierarchical ingredient picker styles, shared with the profile allergy editor.
  searchBox: { height: 48, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 12, paddingHorizontal: 14, marginBottom: 14 },
  searchInput: { flex: 1, minWidth: 0, marginLeft: 8, paddingVertical: 8, fontFamily: FONT_REGULAR, fontSize: 14, color: "#333333" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", fontSize: 15, color: "#999999", fontFamily: FONT_REGULAR, marginTop: 40 },
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
  customInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 16 },
  customInput: { flex: 1, minWidth: 0, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#222222", fontFamily: FONT_REGULAR },
  addBtnSmall: { backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", alignItems: "center" },
  addBtnSmallText: { color: "#FFFFFF", fontSize: 14, fontFamily: FONT_BOLD },
  summaryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  clearAllText: { fontSize: 13, color: "#A66B00", fontFamily: FONT_BOLD },
  selectedItems: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedItem: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1.5, borderColor: ORANGE, backgroundColor: "#FFF1D6" },
  selectedItemText: { fontSize: 13, color: "#6B5A3D", fontFamily: FONT_BOLD },
  
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  
  backButton: {
    width: 120,
    borderWidth: 1.8,
    borderColor: "#333",
    borderRadius: 15,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  
  backText: {
    color: "#111",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },
  
  saveButton: {
    width: 120,
    backgroundColor: ORANGE,
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },
});

export default styles;
