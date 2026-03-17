import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";
export const WHITE = "#FFFFFF"; // 👈 เพิ่มให้เพื่อกัน Error ใน optionCard

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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    flexGrow: 1,
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
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  sectionDesc: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: FONT_REGULAR,
  },

  optionList: {
    marginTop: 12,
    gap: 12,
  },

  optionCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    padding: 16,
  },

  optionCardActive: {
    backgroundColor: ORANGE,
    borderColor: "#C97800",
  },

  optionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionTitle: {
    fontSize: 18,
    color: "#222",
    fontFamily: FONT_BOLD,
  },

  optionTitleActive: {
    color: "#fff",
  },

  optionDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    fontFamily: FONT_REGULAR,
  },

  optionDescActive: {
    color: "#FFF7E8",
  },

  helpButtonWrap: {
    marginTop: 12,
    alignItems: "flex-end",
  },

  helperButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },

  helperButtonText: {
    fontSize: 14,
    color: "#666",
    fontFamily: FONT_BOLD,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  backButton: {
    width: 120,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1.8,
    borderColor: "#333",
    backgroundColor: "#FFF",
    alignItems: "center",
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

  modalItem: {
    marginBottom: 14,
  },

  modalItemTitle: {
    fontSize: 16,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  modalItemDesc: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
    lineHeight: 21,
    fontFamily: FONT_REGULAR,
  },

  modalCloseButton: {
    marginTop: 16,
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
});

export default styles;