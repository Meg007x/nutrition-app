import { StyleSheet, Platform } from 'react-native';

export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";
export const IOS_GREEN = "#34C759";
export const ERROR_RED = "#E53935";
export const CARD_BG = "#FFF";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, position: 'relative' },
  headerBar: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: 'NotoSansThaiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' } as any
    })
  },
  sectionTitle: { fontSize: 20, color: '#222', fontFamily: 'NotoSansThaiBold', marginBottom: 6 },
  sectionDesc: { fontSize: 14, color: '#666', fontFamily: 'NotoSansThai', marginBottom: 16 },

  // --- การ์ดมื้ออาหารแบบใหม่ ---
  mealItemContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealNameInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'NotoSansThaiBold',
    color: '#222',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    padding: 6,
    borderRadius: 8,
  },
  mealControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  timeBtnText: { fontSize: 16, fontFamily: 'NotoSansThaiBold', color: ORANGE },
  
  // --- โซนน้ำดื่ม ---
  waterInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 15,
    paddingHorizontal: 16,
    height: 55,
  },
  waterInputActive: { borderColor: ORANGE },
  waterInputError: { borderColor: ERROR_RED },
  waterTextInput: { flex: 1, fontSize: 22, fontFamily: 'NotoSansThaiBold', color: '#222' },
  waterUnitText: { fontSize: 16, fontFamily: 'NotoSansThaiBold', color: '#888' },
  
  recommendText: { fontSize: 13, fontFamily: 'NotoSansThaiBold', marginTop: 8, color: '#4CAF50' },
  warningText: { fontSize: 13, fontFamily: 'NotoSansThaiBold', marginTop: 4, color: ERROR_RED },

  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EC',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderStyle: 'dashed',
    borderRadius: 15,
    paddingVertical: 14,
    gap: 8,
  },
  addMealBtnText: { color: ORANGE, fontSize: 16, fontFamily: 'NotoSansThaiBold' },
  saveButton: {
    backgroundColor: ORANGE,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontFamily: 'NotoSansThaiBold' }
});