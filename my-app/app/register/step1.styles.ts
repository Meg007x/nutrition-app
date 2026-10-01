import { StyleSheet, Platform } from "react-native";
import { Brand } from "../../constants/theme";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";
export const WHITE = "#FFFFFF";

// สีเพิ่มเติมที่ใช้ในฟอร์ม (ปรับเปลี่ยนโค้ดสีได้ตามต้องการ)
export const ORANGE_DK = Brand.primaryDark;
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
    paddingVertical: 16,
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  homeBackThemedThemedText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT_BOLD,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },

  stepTitle: {
    fontSize: 24,
    color: "#111",
    fontFamily: FONT_BOLD,
    letterSpacing: -0.3,
  },

  progressTrack: {
    marginTop: 10,
    width: "100%",
    height: 6,
    backgroundColor: "#E8E8E8",
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
    marginTop: 16,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    marginTop: 6,
    fontFamily: FONT_BOLD,
  },

  fullInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222",
    fontFamily: FONT_REGULAR,
  },

  birthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  birthInputButton: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
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
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 12,
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
    marginTop: 24,
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  nextButtonThemedThemedText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  dateModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  dateModalHeader: {
    alignItems: "center",
    marginBottom: 12,
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
    gap: 12,
    marginTop: 12,
  },

  dateActionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  dateCancelButton: {
    backgroundColor: "#F0F0F0",
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
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 80,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },

  genderModalTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: "#111",
    fontFamily: FONT_BOLD,
  },

  genderOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  genderOptionThemedThemedText: {
    fontSize: 17,
    color: "#222",
    fontFamily: FONT_BOLD,
  },

  genderCancelButton: {
    marginTop: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
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