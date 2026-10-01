import { StyleSheet } from "react-native";
import { Brand } from "../constants/theme";

export const ORANGE = "#F5A400";
export const ORANGE_LIGHT = Brand.primaryLight;
export const BG = "#FFFFFF";
export const CARD = "#FFFFFF";
export const BORDER = "#E8E8E8";

export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // --- Hero Section ---
  heroSection: {
    backgroundColor: ORANGE,
    paddingTop: 10,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },

  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_BOLD,
    letterSpacing: 0.5,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontFamily: FONT_BOLD,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 8,
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: FONT_REGULAR,
    textAlign: "center",
    lineHeight: 20,
  },

  // --- Floating Brand Tag ---
  floatingTag: {
    position: "absolute",
    top: -1,
    alignSelf: "center",
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  floatingTagText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: FONT_BOLD,
    letterSpacing: 0.3,
  },

  // --- Content Card ---
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 28,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    marginTop: 12,
    fontFamily: FONT_BOLD,
  },

  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222",
    marginBottom: 4,
    fontFamily: FONT_REGULAR,
  },

  inputError: {
    borderColor: "#E53935",
    backgroundColor: "#FFF8F8",
  },

  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: FONT_REGULAR,
    marginLeft: 4,
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  passwordWrapError: {
    borderColor: "#E53935",
    backgroundColor: "#FFF8F8",
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: "#222",
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
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: FONT_BOLD,
  },

  registerLink: {
    marginTop: 16,
    alignItems: "center",
  },

  registerLinkText: {
    color: ORANGE,
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },

  // --- Social Login Divider ---
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },

  dividerText: {
    color: "#999",
    fontSize: 12,
    fontFamily: FONT_REGULAR,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },

  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Error Alert Banner ---
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },

  errorBannerText: {
    color: "#C62828",
    fontSize: 13,
    flex: 1,
    fontFamily: FONT_REGULAR,
    lineHeight: 18,
  },
});

export default styles;