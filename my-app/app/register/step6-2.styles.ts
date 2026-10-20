import { StyleSheet } from "react-native";

// 1. ตัวแปรสี
export const ORANGE = "#DF9226";
export const ORANGE_LIGHT = "#EBA032";
export const BG = "#F3F3F3";
export const DARK = "#C67A1A";

// 2. ตัวแปรฟอนต์
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBar: { backgroundColor: ORANGE, paddingVertical: 14, alignItems: "center" },
  headerText: { color: "#fff", fontSize: 20, fontFamily: FONT_BOLD },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30, flexGrow: 1 },

  stepTitle: { fontSize: 26, color: "#111", fontFamily: FONT_BOLD },

  progressTrack: { marginTop: 12, height: 6, backgroundColor: "#D8D0C0", borderRadius: 8 },
  progressFill: { width: "75%", height: "100%", backgroundColor: ORANGE, borderRadius: 8 },

  subtitle: { marginTop: 24, fontSize: 18, color: "#333", marginBottom: 20, fontFamily: FONT_BOLD },

  // ─── Tier 1: Main Category Card ───
  categoryCard: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#E8E8E8", marginBottom: 10, overflow: "hidden" },
  categoryCardExpanded: { borderColor: ORANGE },
  categoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  categoryEmoji: { fontSize: 22 },
  categoryName: { fontSize: 15, fontFamily: FONT_BOLD, color: "#222" },
  categoryBadge: { backgroundColor: ORANGE_LIGHT, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  categoryBadgeText: { fontSize: 11, fontFamily: FONT_BOLD, color: ORANGE },

  // ─── Tier 2: Sub-category Card ───
  subCategoryArea: { backgroundColor: "#FFF8ED", paddingTop: 6, paddingBottom: 10, paddingHorizontal: 12 },
  subCategoryCard: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#F0E0C8", marginBottom: 8, overflow: "hidden" },
  subCategoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  subCategoryName: { fontSize: 14, fontFamily: FONT_BOLD, color: DARK },

  // ─── Tier 3: Ingredient Chips ───
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 10, paddingBottom: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipUnselected: { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
  chipText: { fontSize: 14, fontFamily: FONT_REGULAR },
  chipTextSelected: { color: "#FFFFFF", fontFamily: FONT_BOLD },
  chipTextUnselected: { color: "#666666" },

  // ─── Custom Input ───
  customInputRow: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 16, gap: 8 },
  customInput: { flex: 1, backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#222", fontFamily: FONT_REGULAR },
  addBtnSmall: { backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", alignItems: "center" },
  addBtnSmallText: { color: "#FFF", fontSize: 14, fontFamily: FONT_BOLD },

  // ─── Summary Box ───
  summaryBox: { marginTop: 8, backgroundColor: "#FFF8EC", borderRadius: 14, borderWidth: 1, borderColor: "#F0D3A3", padding: 14 },
  summaryTitle: { fontSize: 15, color: "#6B5A3D", marginBottom: 6, fontFamily: FONT_BOLD },
  summaryText: { fontSize: 14, color: "#333", lineHeight: 20, fontFamily: FONT_BOLD },

  // ─── Layout ───
  spacer: { flex: 1, minHeight: 40 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  backButton: { borderWidth: 1.5, borderColor: "#222", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, backgroundColor: "#FFF" },
  backText: { color: "#222", fontSize: 16, fontFamily: FONT_BOLD },
  saveButton: { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36 },
  saveText: { color: "#fff", fontSize: 16, fontFamily: FONT_BOLD },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", fontSize: 15, color: "#999", fontFamily: FONT_REGULAR, marginTop: 40 },
});

export default styles;