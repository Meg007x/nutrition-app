import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";
export const WHITE = "#FFFFFF";

// สีสำหรับสถานะการแจ้งเตือน
export const WARN_COLOR = "#FF9500";
export const ERROR_COLOR = "#FF3B30";

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

  headerBarText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },

  stepTitle: {
    fontSize: 26,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  progressTrack: {
    marginTop: 12,
    height: 7,
    backgroundColor: "#D7CFBF",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    width: "42%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  currentInfoCard: {
    marginTop: 18,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  currentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  currentInfoLabel: {
    fontSize: 14,
    color: "#6B5A3D",
    fontFamily: FONT_BOLD,
  },

  currentInfoValue: {
    fontSize: 15,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  goalHeader: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  helpRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  helpText: {
    marginLeft: 4,
    marginRight: 2,
    fontSize: 14,
    color: "#666",
    fontFamily: FONT_BOLD,
  },

  inlineHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    fontFamily: FONT_REGULAR,
  },

  goalGrid: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  goalButton: {
    flex: 1,
    minHeight: 54,
    backgroundColor: "#EA8D20",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },

  goalButtonActive: {
    backgroundColor: "#D77C14",
    borderWidth: 2,
    borderColor: "#B85F00",
  },

  goalButtonText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    fontFamily: FONT_BOLD,
  },

  goalButtonTextActive: {
    color: "#fff",
  },

  inputLabel: {
    marginTop: 18,
    fontSize: 17,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  weightInputWrap: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 52,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  weightInput: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    paddingVertical: 12,
    fontFamily: FONT_REGULAR,
  },

  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  arrowButton: {
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  weightHelperText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    fontFamily: FONT_BOLD,
  },

  selectBox: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#333",
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  selectText: {
    fontSize: 16,
    color: "#111",
    fontFamily: FONT_REGULAR,
  },

  selectArrowWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
  },

  backButton: {
    width: 120,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1.8,
    borderColor: "#333",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 16,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  nextButton: {
    width: 120,
    backgroundColor: ORANGE,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },

  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 22,
    textAlign: "center",
    color: "#111",
    marginBottom: 14,
    fontFamily: FONT_BOLD,
  },

  modalBody: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    fontFamily: FONT_REGULAR,
  },

  modalCloseButton: {
    marginTop: 24,
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCloseText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },

  weekOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  weekOptionText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_REGULAR, // ปรับให้ตัวเลือกปกติเป็นฟอนต์ธรรมดา
  },

  weekOptionTextActive: {
    color: ORANGE,
    fontFamily: FONT_BOLD, // ตัวเลือกที่ถูกเลือกให้เป็นฟอนต์หนา
  },

  modalCancelButton: {
    marginTop: 16,
    backgroundColor: "#EFEFEF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#333",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },
});

export default styles;