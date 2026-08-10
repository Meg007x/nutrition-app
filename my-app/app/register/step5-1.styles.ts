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
    marginBottom: 12,
    fontFamily: FONT_REGULAR,
  },
  
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  modeButton: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  modeButtonActive: {
    backgroundColor: ORANGE,
    borderColor: "#C97800",
  },

  modeButtonText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_BOLD,
  },

  modeButtonTextActive: {
    color: "#fff",
  },

  optionList: {
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

  optionHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#7A5A00",
    fontFamily: FONT_BOLD,
  },

  optionHintActive: {
    color: "#fff",
  },

  optionDetail: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#777",
    fontFamily: FONT_REGULAR,
  },

  optionDetailActive: {
    color: "#FFF0D0",
  },

  proteinValueCard: {
    marginTop: 16,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 16,
    alignItems: "center",
  },

  proteinValueLabel: {
    fontSize: 14,
    color: "#8A5A00",
    fontFamily: FONT_BOLD,
    marginBottom: 6,
  },

  proteinValueNumber: {
    fontSize: 28,
    color: ORANGE,
    fontFamily: FONT_BOLD,
  },

  proteinValueHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#999",
    fontFamily: FONT_REGULAR,
  },

  // --- ปรับสีป้ายแนะนำให้ตัดกันสุดๆ (สีเขียวมรกต + ตัวหนังสือสีขาว) ---
  badgeRecommend: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },

  badgeRecommendText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: FONT_BOLD,
  },

  customCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    padding: 20,
    marginTop: 10,
  },

  customTitle: {
    fontSize: 18,
    color: "#111",
    marginBottom: 12,
    fontFamily: FONT_BOLD,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#CCC",
    paddingHorizontal: 16,
    height: 60,
  },

  customInput: {
    flex: 1,
    fontSize: 24,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  customUnit: {
    fontSize: 16,
    color: "#666",
    marginLeft: 10,
    fontFamily: FONT_BOLD,
  },
  
  validationMsg: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_BOLD,
  },

  validationMsgNormal: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontFamily: FONT_REGULAR,
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
});

export default styles;