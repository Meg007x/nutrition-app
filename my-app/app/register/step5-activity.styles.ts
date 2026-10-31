import { StyleSheet } from "react-native";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const WHITE = "#FFFFFF";
const FONT_REGULAR = "NotoSansThai";
const FONT_BOLD = "NotoSansThaiBold";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBar: {
    alignItems: "center",
    backgroundColor: ORANGE,
    paddingVertical: 14,
  },
  headerBarText: {
    color: WHITE,
    fontFamily: FONT_BOLD,
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  stepTitle: {
    color: "#111",
    fontFamily: FONT_BOLD,
    fontSize: 26,
  },
  progressTrack: {
    backgroundColor: "#D7CFBF",
    borderRadius: 10,
    height: 7,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    height: "100%",
    width: "50%",
  },
  sectionTitle: {
    color: "#222",
    fontFamily: FONT_BOLD,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  sectionHint: {
    color: "#666",
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  options: {
    gap: 9,
  },
  optionCard: {
    backgroundColor: WHITE,
    borderColor: "#D9D9D9",
    borderRadius: 14,
    borderWidth: 1.4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionCardActive: {
    backgroundColor: ORANGE,
    borderColor: "#C97800",
  },
  optionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionTitle: {
    color: "#222",
    fontFamily: FONT_BOLD,
    fontSize: 17,
  },
  optionTitleActive: {
    color: WHITE,
  },
  optionDescription: {
    color: "#555",
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  optionDescriptionActive: {
    color: "rgba(255,255,255,0.85)",
  },
  note: {
    color: "#666",
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
  },
  error: {
    color: "#C62828",
    fontFamily: FONT_BOLD,
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: WHITE,
    borderColor: "#333",
    borderRadius: 15,
    borderWidth: 1.8,
    paddingVertical: 15,
    width: 120,
  },
  backButtonText: {
    color: "#111",
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 15,
    width: 120,
  },
  nextButtonText: {
    color: WHITE,
    fontFamily: FONT_BOLD,
    fontSize: 16,
  },
});

export default styles;
