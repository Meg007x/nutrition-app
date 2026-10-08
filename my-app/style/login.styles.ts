import { StyleSheet } from "react-native";

export const ROW_COLOR_1 = "#EBA032";
export const ROW_COLOR_2 = "#DF9226";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ROW_COLOR_1,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: ROW_COLOR_1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 36,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  content: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222222",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  inputError: {
    borderColor: "#E53935",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  passwordWrapError: {
    borderColor: "#E53935",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222222",
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    color: "#D32F2F",
    fontSize: 13,
    flex: 1,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 16,
  },
  forgotLinkText: {
    color: ROW_COLOR_2,
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: ROW_COLOR_1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: ROW_COLOR_1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  dividerText: {
    fontSize: 12,
    color: "#999999",
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  registerLinkText: {
    color: ROW_COLOR_2,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default styles;