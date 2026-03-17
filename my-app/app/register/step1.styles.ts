import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";
export const WHITE = "#FFFFFF";

// สีเพิ่มเติมที่ใช้ในฟอร์ม (ปรับเปลี่ยนโค้ดสีได้ตามต้องการ)
export const ORANGE_DK = "#D77C14"; 
export const RULER_BG = "#F8F8F8";
export const CARD = "#FFFFFF"; 
export const BORDER = "#E5E5E5"; 

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
    justifyContent: "center",
    position: "relative",
  },

  headerBarThemedThemedText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  homeBackButton: {
    position: "absolute",
    left: 10,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.14)",
  },

  homeBackThemedThemedText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT_BOLD,
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },

  stepTitle: {
    fontSize: 26,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  progressTrack: {
    marginTop: 10,
    width: "100%",
    height: 7,
    backgroundColor: "#D7CFBF",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    width: "12%",
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 999,
  },

  debugText: {
    marginTop: 12,
    color: "#0A66C2",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  errorBox: {
    marginTop: 10,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#E57373",
    borderRadius: 10,
    padding: 10,
  },

  errorText: {
    color: "#B00020",
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  formCard: {
    marginTop: 12,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: BORDER,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },

  label: {
    fontSize: 18,
    color: "#111",
    marginBottom: 6,
    marginTop: 4,
    fontFamily: FONT_BOLD,
  },

  fullInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    fontFamily: FONT_REGULAR,
  },

  birthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  birthInputButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  birthInputThemedThemedText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_REGULAR,
  },

  placeholderThemedThemedText: {
    color: "#8A8A8A",
    fontFamily: FONT_REGULAR,
  },

  calendarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  genderBox: {
    width: "62%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  genderThemedThemedText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_REGULAR,
  },

  spacer: {
    height: 18,
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#333",
    fontFamily: FONT_REGULAR,
  },

  eyeButton: {
    paddingHorizontal: 6,
  },

  nextButton: {
    marginTop: 20,
    backgroundColor: "#FFB300",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },

  nextButtonThemedThemedText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: FONT_BOLD,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  dateModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 22,
  },

  dateModalHeader: {
    alignItems: "center",
    marginBottom: 8,
  },

  dateModalTitle: {
    fontSize: 20,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  datePickerWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    backgroundColor: "#fff",
  },

  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  dateActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  dateCancelButton: {
    backgroundColor: "#EFEFEF",
  },

  dateConfirmButton: {
    backgroundColor: ORANGE,
  },

  dateCancelThemedThemedText: {
    color: "#444",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },

  dateConfirmThemedThemedText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD,
  },

  genderModalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 80,
    padding: 16,
  },

  genderModalTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  genderOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  genderOptionThemedThemedText: {
    fontSize: 17,
    color: "#222",
    fontFamily: FONT_BOLD,
  },

  genderCancelButton: {
    marginTop: 12,
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  genderCancelThemedThemedText: {
    fontSize: 16,
    color: "#333",
    fontFamily: FONT_BOLD,
  },
});

export default styles;