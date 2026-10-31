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
    height: 56,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: FONT_BOLD,
  },
  backIcon: {
    padding: 4,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 22,
    color: "#111",
    fontFamily: FONT_BOLD,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: FONT_REGULAR,
    marginTop: 4,
    marginBottom: 16,
  },

  // Group List
  groupList: {
    gap: 8,
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: "#333",
  },
  groupHint: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: "#888",
    marginTop: 2,
  },
  groupRight: {
    marginLeft: 8,
  },

  // Action Buttons (จัดให้เข้าชุดกัน)
  noneBtn: {
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  noneBtnActive: {
    backgroundColor: ORANGE,
  },
  noneBtnText: {
    fontSize: 15,
    color: ORANGE,
    fontFamily: FONT_BOLD,
  },
  noneBtnTextActive: {
    color: "#FFF",
  },

  addOutlineBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ORANGE,
    backgroundColor: "#FFF",
    alignItems: "center",
    marginBottom: 12,
  },
  addOutlineBtnText: {
    fontSize: 15,
    color: ORANGE,
    fontFamily: FONT_BOLD,
  },

  // Custom Input Row
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#333",
  },
  addBtnSmall: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnSmallText: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: "#FFF",
  },

  // Disabled State สรรสร้างสีเทาเมื่อเลือก "ไม่มีอาหารที่แพ้"
  disabledBtn: {
    backgroundColor: "#F0F0F0",
    borderColor: "#DDD",
  },
  disabledText: {
    color: "#AAA",
  },

  // Summary Box
  summaryBox: {
    marginTop: 4,
    backgroundColor: "#FFF8EC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 14,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6B5A3D",
    fontFamily: FONT_BOLD,
  },
  summaryClearText: {
    fontSize: 13,
    color: "#A66B00",
    fontFamily: FONT_BOLD,
  },
  summaryItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "#FFF",
  },
  summaryItemText: {
    fontSize: 13,
    color: "#333",
    fontFamily: FONT_BOLD,
  },
  summaryEmptyText: {
    fontSize: 13,
    color: "#888",
    fontFamily: FONT_REGULAR,
  },

  // Bottom Navigation Bar
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  cancelBtn: {
    width: 120,
    borderWidth: 1.8,
    borderColor: "#333",
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  cancelBtnText: {
    color: "#333",
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
  confirmBtn: {
    width: 120,
    backgroundColor: ORANGE,
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
});

export default styles;
