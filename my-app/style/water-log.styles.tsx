import { StyleSheet } from "react-native";

export const ORANGE = "#F28A1A";
export const BG = "#F4F4F4";
export const WHITE = "#FFFFFF";
export const BLUE = "#5A9AF4";
export const BLUE_DARK = "#3F7FE0";
export const TEXT = "#111111";
export const SUBTEXT = "#6E6E6E";
export const CARD_BORDER = "#D4D4D4";

export const RING_SIZE = 210;
export const RING_THICKNESS = 16;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: { height: 56, backgroundColor: ORANGE },
  header: {
    paddingHorizontal: 10,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dateText: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: TEXT,
    fontFamily: "NotoSansThaiBold"
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingBottom: 30 },
  summaryCard: {
    marginTop: 16,
    marginHorizontal: 6,
    backgroundColor: "#F1F1F1",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringBase: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: "#CFE0FB",
  },
  ringFill: {
    width: RING_SIZE - 40,
    height: RING_SIZE - 40,
    borderRadius: (RING_SIZE - 40) / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
  },
  totalMlText: { 
    marginTop: 4, 
    fontSize: 42, 
    fontWeight: "900", 
    color: BLUE,
    fontFamily: "NotoSansThaiBold"
  },
  targetText: { 
    marginTop: 8, 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#6D6D6D",
    fontFamily: "NotoSansThaiBold"
  },
  progressText: { 
    marginTop: 6, 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#6D6D6D",
    fontFamily: "NotoSansThaiBold"
  },
  readonlyText: { 
    marginTop: 8, 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#C06A00", 
    textAlign: "center", 
    paddingHorizontal: 20,
    fontFamily: "NotoSansThaiBold"
  },
  quickAddRow: {
    marginTop: 14,
    width: "100%",
    paddingHorizontal: 28,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickAddButton: { alignItems: "center", justifyContent: "center" },
  quickAddButtonDisabled: { opacity: 0.45 },
  plusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickAddText: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#6A6A6A", 
    textAlign: "center",
    fontFamily: "NotoSansThaiBold"
  },
  sectionTitle: {
    marginTop: 18,
    marginHorizontal: 28,
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
    fontFamily: "NotoSansThaiBold"
  },
  listWrap: { marginTop: 12, paddingHorizontal: 12, gap: 18 },
  logCard: {
    minHeight: 82,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#2C2C2C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  logTime: { 
    width: 72, 
    fontSize: 21, 
    fontWeight: "900", 
    color: TEXT,
    fontFamily: "NotoSansThaiBold"
  },
  logMiddle: { flex: 1, justifyContent: "center", paddingRight: 8 },
  logTitle: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: TEXT,
    fontFamily: "NotoSansThaiBold"
  },
  logSubtitle: { 
    marginTop: 2, 
    fontSize: 14, 
    fontWeight: "700", 
    color: SUBTEXT,
    fontFamily: "NotoSansThaiBold"
  },
  logEditedAt: {
    marginTop: 2,
    fontSize: 11,
    color: SUBTEXT,
    fontFamily: "NotoSansThai",
  },
  logRight: { alignItems: "flex-end", justifyContent: "center", gap: 6 },
  logActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  logAmount: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: "#4B89F7",
    fontFamily: "NotoSansThaiBold"
  },
  deleteIconButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { 
    textAlign: "center", 
    color: SUBTEXT, 
    fontSize: 16, 
    fontWeight: "700", 
    marginTop: 8,
    fontFamily: "NotoSansThaiBold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "90%",
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  editModalScroll: {
    width: "100%",
    maxHeight: "100%",
    flexShrink: 1,
  },
  editModalScrollContent: {
    alignItems: "center",
    paddingBottom: 2,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FCEBEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "900", 
    color: TEXT, 
    marginBottom: 8,
    fontFamily: "NotoSansThaiBold"
  },
  modalMessage: {
    fontSize: 16,
    color: SUBTEXT,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "NotoSansThai"
  },
  modalButtonRow: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: { backgroundColor: "#F0F0F0" },
  modalConfirmBtn: { backgroundColor: "#D9534F" },
  editModalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  editFieldLabel: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 6,
    color: TEXT,
    fontSize: 14,
    fontFamily: "NotoSansThaiBold",
  },
  editInput: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: TEXT,
    fontSize: 16,
    fontFamily: "NotoSansThai",
  },
  editTimeButton: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTimeText: {
    color: TEXT,
    fontSize: 16,
    fontFamily: "NotoSansThai",
  },
  timePickerWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  timePickerColumns: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  timePickerColumnWrap: {
    flex: 1,
    alignItems: "center",
  },
  timePickerColumnTitle: {
    color: SUBTEXT,
    fontSize: 13,
    marginBottom: 4,
    fontFamily: "NotoSansThaiBold",
  },
  timePickerColumn: {
    width: "100%",
    maxHeight: 150,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 10,
  },
  timePickerOption: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  timePickerOptionSelected: {
    backgroundColor: "#EAF2FF",
  },
  timePickerOptionText: {
    color: TEXT,
    fontSize: 16,
    fontFamily: "NotoSansThai",
  },
  timePickerOptionTextSelected: {
    color: BLUE_DARK,
    fontFamily: "NotoSansThaiBold",
  },
  timePickerOptionTextDisabled: {
    color: "#D3D3D3",
  },
  editErrorText: {
    width: "100%",
    marginTop: 10,
    color: "#D9534F",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  timePickerDoneButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timePickerDoneText: {
    color: BLUE_DARK,
    fontSize: 15,
    fontFamily: "NotoSansThaiBold",
  },
  containerTypeRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginBottom: 20,
  },
  containerTypeButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  containerTypeButtonSelected: {
    borderColor: BLUE,
    backgroundColor: "#EAF2FF",
  },
  containerTypeText: {
    color: SUBTEXT,
    fontSize: 15,
    fontFamily: "NotoSansThai",
  },
  containerTypeTextSelected: {
    color: BLUE_DARK,
    fontFamily: "NotoSansThaiBold",
  },
  editConfirmBtn: { backgroundColor: BLUE_DARK },
  modalCancelText: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#6A6A6A",
    fontFamily: "NotoSansThaiBold"
  },
  modalConfirmText: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: WHITE,
    fontFamily: "NotoSansThaiBold"
  },
});