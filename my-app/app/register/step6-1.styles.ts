import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
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
    paddingVertical: 14,
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
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
    overflow: "hidden",
  },

  progressFill: {
    width: "75%",
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 18,
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: FONT_REGULAR,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  allergyBtn: {
    width: "48%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  allergyBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },

  allergyText: {
    fontSize: 16,
    color: "#FFF",
    fontFamily: FONT_BOLD,
  },

  allergyTextActive: {
    color: ORANGE,
  },

  otherBtn: {
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  otherBtnText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_BOLD,
  },

  noneBtn: {
    width: "100%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  noneBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },

  noneBtnText: {
    fontSize: 18,
    color: "#FFF",
    fontFamily: FONT_BOLD,
  },

  noneBtnTextActive: {
    color: ORANGE,
  },

  summaryBox: {
    marginTop: 16,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 14,
  },

  summaryTitle: {
    fontSize: 15,
    color: "#6B5A3D",
    marginBottom: 8,
    fontFamily: FONT_BOLD,
  },

  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: FONT_BOLD,
  },

  summaryChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  summaryChip: {
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

  summaryChipText: {
    color: "#8A5A00",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  summaryChipRemove: {
    marginLeft: 8,
    color: "#C96E00",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },

  backButton: {
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: "#FFF",
  },

  backText: {
    color: "#222",
    fontFamily: FONT_BOLD,
  },

  nextButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  nextText: {
    color: "#fff",
    fontFamily: FONT_BOLD,
  },

  disabledButton: {
    backgroundColor: "#E5E5E5",
    borderColor: "#D0D0D0",
  },

  disabledOtherBtn: {
    backgroundColor: "#F2F2F2",
    borderColor: "#D8D8D8",
  },

  disabledText: {
    color: "#999",
    fontFamily: FONT_REGULAR,
  },
});

export default styles;