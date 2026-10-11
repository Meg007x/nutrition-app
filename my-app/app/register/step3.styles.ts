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

// 3. ตัวแปรความกว้างของขีดไม้บรรทัด (เปลี่ยนตัวเลขได้ตามต้องการ)
export const ITEM_WIDTH = 16; 

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

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stepTitle: {
    fontSize: 26,
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
    color: "#666",
    fontSize: 13,
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
    width: "30%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  textCenter: {
    alignItems: "center",
    marginTop: 24,
  },

  questionTitle: {
    fontSize: 21,
    color: "#111",
    textAlign: "center",
    fontFamily: FONT_BOLD,
  },

  questionDesc: {
    marginTop: 8,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
    fontSize: 15,
    paddingHorizontal: 10,
    fontFamily: FONT_REGULAR,
  },

  unitToggleWrap: {
    marginTop: 24,
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#CCC",
  },

  unitButton: {
    paddingHorizontal: 26,
    paddingVertical: 8,
    backgroundColor: "#FFF",
  },

  unitButtonActive: {
    backgroundColor: ORANGE,
  },

  unitText: {
    color: "#666",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },

  unitTextActive: {
    color: "#fff",
  },

  valueSection: {
    marginTop: 34,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },

  bigValue: {
    fontSize: 86,
    color: "#111",
    lineHeight: 90,
    includeFontPadding: false,
    fontFamily: FONT_BOLD,
  },

  bigUnit: {
    fontSize: 34,
    color: "#111",
    marginLeft: 8,
    marginBottom: 14,
    lineHeight: 36,
    includeFontPadding: false,
    fontFamily: FONT_BOLD,
  },

  rulerSection: {
    marginTop: 18,
    height: 120,
    justifyContent: "center",
    position: "relative",
  },

  centerLine: {
    position: "absolute",
    left: "50%",
    marginLeft: -1,
    top: 12,
    bottom: 0,
    width: 2,
    backgroundColor: ORANGE,
    zIndex: 10,
  },

  rulerItem: {
    width: ITEM_WIDTH,
    height: 120,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 6,
  },

  rulerLabel: {
    position: "absolute",
    top: 0,
    fontSize: 11,
    color: "#333",
    fontFamily: FONT_BOLD,
  },

  labelSpacer: {
    height: 14,
  },

  tick: {
    width: 2,
    height: 28,
    backgroundColor: "#333",
    borderRadius: 999,
  },

  tickMedium: {
    height: 45,
  },

  tickMajor: {
    height: 82,
    width: 2.5,
    backgroundColor: "#111",
  },

  bmiCard: {
    marginTop: 18,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  bmiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  bmiTitle: {
    fontSize: 16,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  bmiStatus: {
    fontSize: 16,
    marginLeft: 2,
    fontFamily: FONT_BOLD,
  },

  bmiContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  bmiValue: {
    fontSize: 22,
    minWidth: 62,
    fontFamily: FONT_BOLD,
  },

  bmiMessage: {
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
    lineHeight: 21,
    color: "#444",
    fontFamily: FONT_REGULAR,
  },

  heightHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
    fontFamily: FONT_BOLD,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 18,
  },

  backButton: {
    width: 120,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1.8,
    borderColor: "#333",
    backgroundColor: WHITE,
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
    padding: 25,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
  },

  modalTitle: {
    fontSize: 22,
    textAlign: "center",
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  modalBody: {
    marginTop: 15,
    lineHeight: 24,
    fontSize: 16,
    color: "#444",
    fontFamily: FONT_REGULAR,
  },

  modalCloseButton: {
    marginTop: 25,
    backgroundColor: ORANGE,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCloseText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },
});

export default styles;