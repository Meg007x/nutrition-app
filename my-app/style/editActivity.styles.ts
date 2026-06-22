import { StyleSheet } from "react-native";

// --- ตัวแปรสีและฟอนต์มาตรฐาน (ดึงมาจาก step5) ---
export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ERROR_COLOR = "#FF3B30";
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
    marginLeft: 10,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#111",
    fontFamily: FONT_BOLD,
    marginBottom: 12,
  },
  // --- การ์ดตัวเลือกระดับกิจกรรม ---
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  cardActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT_BOLD,
    color: "#333",
  },
  cardTitleActive: {
    color: "#fff",
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: FONT_REGULAR,
    color: "#666",
    marginTop: 4,
  },
  cardDescActive: {
    color: "#fff",
  },
  // --- แท็บเลือกโหมดโปรตีน ---
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tabBtnActive: {
    backgroundColor: ORANGE,
  },
  tabText: {
    fontFamily: FONT_REGULAR,
    color: "#333",
    fontSize: 15,
  },
  tabTextActive: {
    fontFamily: FONT_BOLD,
    color: "#fff",
  },
  // --- ช่องกรอกโปรตีน (กำหนดเอง) ---
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CCC",
    paddingHorizontal: 16,
    height: 55,
  },
  numericInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONT_BOLD,
    color: "#111",
  },
  unitText: {
    fontSize: 16,
    fontFamily: FONT_BOLD,
    color: "#666",
    marginLeft: 10,
  },
  validationText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  validationTextNormal: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: FONT_REGULAR,
    color: "#666",
  },
  // --- ปุ่มบันทึก ---
  saveButton: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: FONT_BOLD,
  },
});