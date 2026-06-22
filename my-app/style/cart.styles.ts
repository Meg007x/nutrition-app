import { StyleSheet, Platform } from "react-native";

export const ORANGE = "#F5A400";
export const GREEN = "#2e7d32";
export const BG = "#EFEFEF"; 

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BG 
  },
  header: { 
    backgroundColor: ORANGE, 
    paddingVertical: 16, 
    alignItems: "center",
    ...Platform.select({
      ios: { paddingTop: 40 }, 
    })
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 140 
  },
  sectionTitleWrap: {
    marginBottom: 12,
  },
  // --- สไตล์การ์ดอาหารในตะกร้า ---
  foodCard: { 
    backgroundColor: "#ffffff", 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 2, 
    borderColor: "#000000", 
    marginBottom: 12, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderLeftWidth: 6, 
    borderLeftColor: ORANGE 
  },
  foodInfo: { 
    flex: 1,
    paddingRight: 10,
  },
  foodNutrient: { 
    alignItems: "flex-end",
    minWidth: 90,
  },
  // --- สไตล์การ์ดหลัก 2 ใบแยกชิ้นกันชัดเจน ---
  summaryBox: { 
    backgroundColor: "#ffffff", 
    borderColor: "#000000", 
    borderWidth: 2, 
    borderRadius: 16, 
    padding: 16, 
    ...Platform.select({
      ios: { 
        shadowColor: '#000000', 
        shadowOffset: { width: 0, height: 5 }, 
        shadowOpacity: 0.22, 
        shadowRadius: 6 
      },
      android: { 
        elevation: 6 
      },
    })
  },
  summaryTitleWrap: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000", 
    paddingBottom: 10,
    marginBottom: 14,
  },
  summaryRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center"
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: "#000000",
  },
  submitButton: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  devContainer: {
    marginTop: 40,
    padding: 14,
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: 10,
    borderStyle: "dashed",
    backgroundColor: "#E6E6E6",
  },
  devButton: {
    backgroundColor: "#000000", 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  // ==========================================
  // 🟢 สไตล์จัดการสีและฟอนต์บังคับ (แก้ตัวหนังสือจางแบบเด็ดขาด)
  // ==========================================
  textBlack: {
    color: "#000000",
    opacity: 1,
    fontFamily: Platform.select({ ios: "Noto Sans Thai", android: "NotoSansThai-Regular" }),
  },
  textBlackBold: {
    color: "#000000",
    opacity: 1,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Noto Sans Thai", android: "NotoSansThai-Bold" }),
  },
  textWhite: {
    color: "#ffffff",
    opacity: 1,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Noto Sans Thai", android: "NotoSansThai-Bold" }),
  },
  textWhiteSmall: {
    color: "#ffffff",
    opacity: 1,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Noto Sans Thai", android: "NotoSansThai-Bold" }),
  },
  calNumberText: {
    fontSize: 38, 
    fontWeight: "900", 
    color: ORANGE, 
    marginTop: 4,
    fontFamily: Platform.select({ ios: "Noto Sans Thai", android: "NotoSansThai-Bold" }),
  }
});