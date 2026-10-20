
import { StyleSheet } from "react-native";

export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const FONT_REGULAR = "NotoSansThai";
export const FONT_BOLD = "NotoSansThaiBold";

export default StyleSheet.create({
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
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  stepTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 22,
    color: "#222222",
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    width: "77.78%",
    backgroundColor: ORANGE,
    borderRadius: 10,
  },
  subtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    marginBottom: 18,
  },
  avoidAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  avoidAllButtonActive: {
    borderColor: ORANGE,
    backgroundColor: "#FFF5DE",
  },
  avoidAllTextContainer: {
    flex: 1,
  },
  avoidAllTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: "#333333",
  },
  avoidAllTitleActive: {
    color: "#9A6000",
  },
  avoidAllDescription: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: "#777777",
    lineHeight: 18,
    marginTop: 4,
  },
  avoidAllDescriptionActive: {
    color: "#9A6000",
  },
  ingredientContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  categorySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoryTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: "#555555",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ingredientName: {
    flex: 1,
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: "#333333",
    marginLeft: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#BBBBBB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    borderColor: ORANGE,
    backgroundColor: ORANGE,
  },
  checkboxTick: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: FONT_BOLD,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  messageBox: {
    backgroundColor: "#FFF8E8",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  emptyTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    color: "#555555",
    textAlign: "center",
    marginBottom: 8,
  },
  infoText: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: "#777777",
    lineHeight: 21,
    textAlign: "center",
  },
  errorText: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: "#C62828",
    lineHeight: 21,
    textAlign: "center",
  },
  retryBackButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#EEEEEE",
  },
  retryBackText: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    color: "#444444",
  },
  summaryBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  summaryTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    color: "#333333",
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: "#666666",
    lineHeight: 21,
  },
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
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ORANGE,
  },
  saveText: {
    fontFamily: FONT_BOLD,
    color: "#FFFFFF",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.45,
  },
});