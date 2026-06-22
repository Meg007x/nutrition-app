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
    fontSize: 18,
    color: '#111',
    fontFamily: 'NotoSansThaiBold',
    marginBottom: 16,
  },
  // สไตล์สำหรับ Accordion หมวดหมู่อาหาร
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  categoryTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'NotoSansThaiBold',
  },
  badge: {
    backgroundColor: '#FFF4DD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 10,
  },
  badgeText: {
    color: ORANGE,
    fontSize: 12,
    fontFamily: 'NotoSansThaiBold',
  },
  // รายการย่อยด้านในหมวดหมู่
  foodListContainer: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 8,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  foodItemText: {
    fontSize: 15,
    color: '#444',
    fontFamily: 'NotoSansThai',
  },
  // ปุ่ม
  saveButton: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansThaiBold',
  }
});