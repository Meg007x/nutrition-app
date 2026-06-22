import { StyleSheet, Platform } from 'react-native';

export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    position: 'relative',
  },
  headerBar: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backIcon: { padding: 4 },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'NotoSansThaiBold',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#111',
    fontFamily: 'NotoSansThaiBold',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'NotoSansThai',
    marginBottom: 20,
    lineHeight: 22,
  },
  listContainer: {
    gap: 12,
  },
  // 🤍 กล่องที่ยัง "ไม่ได้เลือก" -> เปลี่ยนเป็นพื้นหลังสีขาว ขอบเทาอ่อน
  cuisineItemUnselected: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' } as any
    })
  },
  // 🧡 กล่องที่ "ถูกเลือกแล้ว" -> เปลี่ยนเป็นพื้นหลังสีส้ม ขอบสีส้ม
  cuisineItemSelected: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 3px 6px rgba(0,0,0,0.1)' } as any
    })
  },
  // ข้อความในกล่องที่ยังไม่ได้เลือก -> สีดำ/เทาเข้ม
  cuisineTextUnselected: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'NotoSansThaiBold',
  },
  // ข้อความในกล่องที่เลือกแล้ว -> สีขาวเด่นๆ
  cuisineTextSelected: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'NotoSansThaiBold',
  },
  saveButton: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansThaiBold',
  }
});