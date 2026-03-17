import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";
export const WHITE = "#FFFFFF";

// สีเพิ่มเติมที่ใช้ในหน้า 2 (ปรับเปลี่ยนโค้ดสีได้ตามต้องการ)
export const ORANGE_DK = "#D77C14"; 
export const RULER_BG = "#F8F8F8";

// สีสำหรับสถานะการแจ้งเตือน
export const WARN_COLOR = "#FF9500";
export const ERROR_COLOR = "#FF3B30";

// 2. ตัวแปรฟอนต์
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

// 3. Ruler Config ─────────────────────────────────────────────────────────────
export const MIN_CM = 100;
export const MAX_CM = 220;
export const ITEM_HEIGHT = 13;
export const RULER_WIDTH = 110;
export const DEFAULT_HEIGHT_CM = 171;

export const HEIGHT_DATA = Array.from(
  { length: MAX_CM - MIN_CM + 1 },
  (_, i) => MAX_CM - i
);
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  headerBarText: {
    color: WHITE,
    fontSize: 20,
    letterSpacing: 0.3,
    fontFamily: FONT_BOLD,
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  stepTitle: {
    fontSize: 26,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  helpText: {
    fontSize: 13,
    color: "#444",
    fontFamily: FONT_BOLD,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#D4C9B5",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 18,
  },

  progressFill: {
    width: "18%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 999,
  },

  questionTitle: {
    fontSize: 20,
    color: "#111",
    textAlign: "center",
    fontFamily: FONT_BOLD,
  },

  questionDesc: {
    marginTop: 8,
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 16,
    fontFamily: FONT_REGULAR,
  },

  unitToggleWrap: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#222",
    overflow: "hidden",
    marginBottom: 12,
    borderRadius: 6,
  },

  unitButton: {
    width: 72,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },

  unitButtonActive: {
    backgroundColor: ORANGE,
  },

  unitText: {
    fontSize: 17,
    color: "#333",
    fontFamily: FONT_BOLD,
  },

  unitTextActive: {
    color: WHITE,
  },

  displayArea: {
    flex: 1,
    backgroundColor: WHITE,
    position: "relative",
    overflow: "hidden",
  },

  leftZone: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: "50%",
    right: RULER_WIDTH + 16,
    zIndex: 2,
    justifyContent: "flex-end",
    paddingLeft: 16,
    paddingBottom: 10,
  },

  valueBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  bigValue: {
    fontSize: 96,
    lineHeight: 100,
    color: "#0A0A0A",
    letterSpacing: -3,
    includeFontPadding: false,
    fontFamily: FONT_BOLD,
  },

  bigUnit: {
    fontSize: 32,
    lineHeight: 42,
    color: "#0A0A0A",
    marginLeft: 4,
    marginBottom: 8,
    letterSpacing: -0.5,
    fontFamily: FONT_BOLD,
  },

  selectionLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -2,
    height: 4,
    backgroundColor: ORANGE_DK,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  lineArrow: {
    position: "absolute",
    right: RULER_WIDTH - 1,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: ORANGE_DK,
  },

  rulerContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: RULER_WIDTH,
    backgroundColor: RULER_BG,
    zIndex: 4,
  },

  rulerList: {
    flex: 1,
    width: "100%",
  },

  rulerBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  rulerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 80,
    zIndex: 10,
  },

  rulerFadeTop: {
    top: 0,
    backgroundColor: RULER_BG,
    opacity: 0.78,
  },

  rulerFadeBottom: {
    bottom: 0,
    backgroundColor: RULER_BG,
    opacity: 0.78,
  },

  rulerRow: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },

  rulerLabelMajor: {
    width: 36,
    fontSize: 11,
    color: "#333",
    letterSpacing: -0.3,
    fontFamily: FONT_BOLD,
  },

  rulerLabelSpacer: {
    width: 36,
  },

  tick: {
    height: 1.5,
    width: 12,
    backgroundColor: "#9B8C78",
    marginLeft: "auto",
  },

  tickMedium: {
    width: 20,
    height: 2,
    backgroundColor: "#7A6A58",
  },

  tickMajor: {
    width: 32,
    height: 2.5,
    backgroundColor: "#3A3028",
  },

  bottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  backButton: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C0C0C0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  backButtonText: {
    color: "#111",
    fontSize: 17,
    fontFamily: FONT_BOLD,
  },

  nextButton: {
    flex: 1,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    elevation: 4,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },

  nextButtonText: {
    color: WHITE,
    fontSize: 17,
    fontFamily: FONT_BOLD,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 19,
    color: "#111",
    marginBottom: 12,
    fontFamily: FONT_BOLD,
  },

  modalBody: {
    fontSize: 15,
    color: "#444",
    lineHeight: 26,
    fontFamily: FONT_REGULAR,
  },

  modalCloseButton: {
    marginTop: 18,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  modalCloseText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },
});

export default styles;