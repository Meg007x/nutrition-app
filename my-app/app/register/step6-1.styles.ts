import { StyleSheet } from "react-native";

export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
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
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    fontFamily: FONT_BOLD,
    fontSize: 18,
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  stepTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 22,
    color: "#222222",
    marginBottom: 4,
  },

  progressTrack: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    width: "75%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },

  subtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#666666",
    lineHeight: 22,
    marginTop: 18,
    marginBottom: 12,
  },

  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    paddingVertical: 8,
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#333333",
  },

  // รายการกลุ่มอาหารแพ้: 2 คอลัมน์
  groupList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },

  // การ์ดแต่ละกลุ่ม
  groupCard: {
    width: "49%",
    height: 70,
    minHeight: 80,
    position: "relative",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1.2,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  groupCardSelected: {
    borderColor: ORANGE,
    backgroundColor: "#FFF9ED",
  },

  // ข้อความอยู่ตรงกลาง โดยเว้นพื้นที่ไอคอนด้านขวา
  groupInfo: {
    position: "absolute",
    left: 8,
    right: 28,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  groupName: {
    width: "100%",
    fontFamily: FONT_BOLD,
    fontSize: 16,
    lineHeight: 19,
    color: "#333333",
    textAlign: "center",
  },

  groupNameSelected: {
    color: "#9A6000",
  },

  groupHint: {
    marginTop: 4,
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    lineHeight: 15,
    color: "#777777",
    textAlign: "center",
  },

  selectedDescription: {
    marginTop: 4,
    fontFamily: FONT_REGULAR,
    fontSize: 10,
    lineHeight: 15,
    color: "#9A6000",
    textAlign: "center",
  },

  // ไอคอนเรียงแนวนอนทางขวา กึ่งกลางแนวตั้ง
  groupRight: {
    position: "absolute",
    right: 7,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },

  // สรุปรายการที่เลือก
  summaryBox: {
    marginTop: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  summaryTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    color: "#333333",
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  summaryInfo: {
    flex: 1,
    paddingRight: 8,
  },

  summaryGroupName: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: "#444444",
  },

  summaryDetail: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },

  emptyText: {
    width: "100%",
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    paddingVertical: 12,
  },

  // ปุ่มไม่มีอาหารที่แพ้
  noneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  noneButtonActive: {
    borderColor: ORANGE,
    backgroundColor: "#F5A400",
  },

  noneButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: "#444444",
  },

  noneButtonTextActive: {
    color: "#FFFFFF",
  },

  noneChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  noneChipText: {
    fontFamily: FONT_BOLD,
    color: "#8A5A00",
  },

  note: {
    marginTop: 10,
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    lineHeight: 19,
    color: "#777777",
  },

  // ปุ่มย้อนกลับและถัดไป
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },

  backButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#FFFFFF",
  },

  backText: {
    fontFamily: FONT_BOLD,
    color: "#555555",
    fontSize: 15,
  },

  nextButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ORANGE,
  },

  nextText: {
    fontFamily: FONT_BOLD,
    color: "#FFFFFF",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.45,
  },
});

export default styles;