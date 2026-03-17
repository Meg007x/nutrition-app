import { StyleSheet, Platform } from "react-native";

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
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนาแทน fontWeight
  },

  scroll: { flex: 1 },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  stepTitle: {
    fontSize: 26,
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนา
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
    fontSize: 20,
    color: "#222",
    marginBottom: 16,
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนา
  },

  listContainer: {
    marginTop: 8,
    gap: 12,
  },

  cuisineItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  cuisineItemUnselected: {
    backgroundColor: "#EBA032",
    borderWidth: 1.5,
    borderColor: "#EBA032",
  },

  cuisineItemSelected: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#EBA032",
  },

  cuisineText: {
    fontSize: 18,
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนา
  },

  cuisineTextUnselected: {
    color: "#FFF",
  },

  cuisineTextSelected: {
    color: "#222",
  },

  spacer: {
    flex: 1,
    minHeight: 80,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  backButton: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  backText: {
    color: "#222",
    fontSize: 16,
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนา
  },

  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT_BOLD, // 👈 ใช้ฟอนต์ตัวหนา
  },
});

export default styles;