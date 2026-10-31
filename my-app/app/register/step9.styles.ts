import { StyleSheet } from "react-native";

// 1. ตัวแปรสี

export const ORANGE = "#F5A400";

export const BG = "#F3F3F3";
export const CARD_BG = "#FDF8EA";
export const IOS_GREEN = "#34C759";

// 2. ตัวแปรฟอนต์ (อ้างอิงจาก ThemedText ของคุณ)
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    alignItems: "center",
  },

  headerText: { 
    color: "#fff", 
    fontSize: 20, 
    fontFamily: FONT_BOLD // 👈 ใช้ฟอนต์ตัวหนา
  },

  scroll: { flex: 1 },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  stepTitle: { 
    fontSize: 26, 
    fontFamily: FONT_BOLD 
  },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 16,
    color: "#444",
    marginBottom: 16,
    fontFamily: FONT_REGULAR // 👈 ใช้ฟอนต์ธรรมดา
  },

  timeHint: {
    color: "#555",
    fontSize: 13,
    lineHeight: 20,
    marginTop: -8,
    marginBottom: 16,
    fontFamily: FONT_REGULAR,
  },

  timeOrderError: {
    color: "#B42318",
    backgroundColor: "#FEE4E2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D4D4D4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },

  dropdownText: { 
    fontSize: 16, 
    color: "#000",
    fontFamily: FONT_BOLD 
  },

  dropdownList: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  dropdownItemText: { 
    fontSize: 16, 
    color: "#333",
    fontFamily: FONT_REGULAR 
  },

  dropdownItemDisabled: { backgroundColor: "#F5F5F5" },
  dropdownItemTextDisabled: { color: "#B8B8B8" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionIcon: { fontSize: 20, marginRight: 8 },

  sectionTitle: { 
    fontSize: 18, 
    color: "#222",
    fontFamily: FONT_BOLD 
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0D3A3",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    color: "#000",
    marginBottom: 8,
    fontFamily: FONT_BOLD 
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  switchLabel: { 
    fontSize: 14, 
    color: "#444",
    fontFamily: FONT_REGULAR 
  },

  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  inputWrapper: { flex: 1 },

  inputLabel: {
    fontSize: 14,
    color: "#222",
    marginBottom: 6,
    fontFamily: FONT_BOLD 
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D4D4D4",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    fontFamily: FONT_REGULAR 
  },

  timeText: {
    fontSize: 16,
    color: "#222",
    fontFamily: FONT_REGULAR 
  },

  timePeriod: {
    color: "#555",
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONT_REGULAR,
  },

  disabledAddMealBtn: { opacity: 0.45 },

  timePickerBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  timePickerCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
    alignSelf: "center",
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  timePickerTitle: {
    color: "#222",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },
  timePickerHint: {
    marginTop: 5,
    color: "#666",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONT_REGULAR,
  },
  pickerColumns: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  pickerColumn: { flex: 1, minWidth: 0 },
  pickerColumnTitle: {
    marginBottom: 6,
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    fontFamily: FONT_BOLD,
  },
  pickerScroll: {
    height: 220,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },
  pickerOption: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  pickerOptionSelected: { backgroundColor: "#FFF0D7" },
  pickerOptionDisabled: { backgroundColor: "#F1F1F1" },
  pickerOptionText: {
    color: "#333",
    fontSize: 16,
    fontFamily: FONT_REGULAR,
  },
  pickerOptionTextSelected: { color: ORANGE, fontFamily: FONT_BOLD },
  pickerOptionTextDisabled: { color: "#BDBDBD" },
  timePickerButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  timePickerCancelButton: {
    minWidth: 92,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
  },
  timePickerCancelText: { color: "#444", fontSize: 14, fontFamily: FONT_BOLD },
  timePickerConfirmButton: {
    minWidth: 120,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: ORANGE,
  },
  timePickerConfirmDisabled: { backgroundColor: "#C9C9C9" },
  timePickerConfirmText: { color: "#FFFFFF", fontSize: 14, fontFamily: FONT_BOLD },

  spacer: { flex: 1, minHeight: 60 },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  backButton: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  addMealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4DD",
    borderWidth: 1,
    borderColor: ORANGE,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 20,
  },

  addMealBtnText: {
    color: ORANGE,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: FONT_BOLD 
  },

  backText: { 
    color: "#222", 
    fontSize: 16,
    fontFamily: FONT_BOLD 
  },

  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: "center",
  },

  saveText: { 
    color: "#FFF", 
    fontSize: 16,
    fontFamily: FONT_BOLD 
  },
});

export default styles;
