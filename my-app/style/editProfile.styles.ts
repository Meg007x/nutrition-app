import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // 🟢 เปลี่ยนพื้นหลังเป็นสีขาวคลีน
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  headerBar: { height: 60, backgroundColor: '#F07D08', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, // สีส้มตามแบบ
  headerTitle: { fontSize: 20, marginLeft: 8, color: '#000', fontWeight: 'bold' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  
  // ส่วนรูปโปรไฟล์และชื่อ
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#000', overflow: 'hidden', backgroundColor: '#FFF' },
  avatar: { width: '100%', height: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  nameInput: { fontSize: 22, fontWeight: 'bold', color: '#000', minWidth: 120, textAlign: 'center', paddingVertical: 0 },
  emailSub: { color: '#666', fontSize: 16, marginTop: 4 },
  
  // กล่องน้ำหนัก ส่วนสูง
  rowWeightHeight: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  measurementBox: { width: '48%', backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: '#333' }, // 🟢 ขอบสีดำชัดเจน
  boxLabel: { fontSize: 16, color: '#000', textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
  numberSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  weightInput: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', textAlign: 'center', minWidth: 60, padding: 0 }, // สีน้ำเงิน
  heightInput: { fontSize: 24, fontWeight: 'bold', color: '#34C759', textAlign: 'center', minWidth: 60, padding: 0 }, // สีเขียว
  unitContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  unitTextWeight: { fontSize: 18, color: '#007AFF', fontWeight: 'bold', marginLeft: 2 },
  unitTextHeight: { fontSize: 18, color: '#34C759', fontWeight: 'bold', marginLeft: 2 },
  
  // กล่องข้อมูลอื่นๆ (TDEE, วันเกิด, ฯลฯ)
  infoRowItem: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  infoTextGroup: { marginLeft: 16, flex: 1 },
  infoLabel: { color: 'gray', fontSize: 14, marginBottom: 2, fontWeight: '600' },
  infoValue: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  // ส่วนล่าง (ช่วยเหลือ + ปุ่มบันทึก)
  tdeeHelpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 32, paddingHorizontal: 4 },
  helpText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#333', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#FFA000', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  saveButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' }
});