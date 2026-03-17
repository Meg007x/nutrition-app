import { StyleSheet, Platform } from "react-native";

// 1. ใส่ export ให้ตัวแปรสี เพื่อส่งไปใช้ในไฟล์หลัก
export const ORANGE = "#F5A400";
export const BG = "#F1F1F1";
export const CARD = "#F6F6F6";
export const BORDER = "#222";

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

  headerText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: FONT_BOLD,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: BORDER,
    padding: 16,
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

  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    fontFamily: FONT_REGULAR,
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: "#333",
    paddingHorizontal: 10,
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

  loginButton: {
    marginTop: 20,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },

  registerLink: {
    marginTop: 16,
    alignItems: "center",
  },

  registerLinkText: {
    color: "#0A66C2",
    fontSize: 15,
    fontFamily: FONT_BOLD, // ใช้ Bold แทน fontWeight: "700"
  },
});

export default styles;