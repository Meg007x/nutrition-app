import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  }, // 🟢 เปลี่ยนพื้นหลังเป็นสีขาวคลีน

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },

  headerBar: {
    height: 56,
    backgroundColor: '#F5A400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  }, // สีส้มตามแบบ

  headerTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },

  headerBtn: {
    width: 40,
    alignItems: 'center',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ส่วนรูปโปรไฟล์และชื่อ

  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },

  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F5A400',
  },

  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
  },

  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5A400',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },

  changePhotoText: {
    color: '#F5A400',
    fontSize: 14,
    fontWeight: '600',
  },

  avatarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  avatarActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
  },

  input: {
    height: 46,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#222',
  },

  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 0,
  },

  emailSub: {
    color: '#666',
    fontSize: 16,
    marginTop: 4,
  },

  // กล่องน้ำหนัก ส่วนสูง

  rowWeightHeight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  measurementBox: {
    width: '48%',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  }, // 🟢 ขอบสีดำชัดเจน

  boxLabel: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },

  numberSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  weightInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  }, // สีน้ำเงิน

  heightInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  }, // สีเขียว

  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },

  unitTextWeight: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 2,
  },

  unitTextHeight: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // กล่องข้อมูลอื่นๆ (TDEE, วันเกิด, ฯลฯ)

  infoRowItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },

  infoTextGroup: {
    marginLeft: 16,
    flex: 1,
  },

  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },

  infoValue: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ส่วนล่าง (ช่วยเหลือ + ปุ่มบันทึก)

  tdeeHelpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 4,
  },

  helpText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },

  genderBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  genderBtnActive: {
    borderColor: '#F5A400',
    backgroundColor: '#FFF5E6',
  },

  genderText: {
    fontSize: 16,
    color: '#666',
  },

  genderTextActive: {
    color: '#F5A400',
    fontWeight: 'bold',
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  passwordText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },

  saveBtn: {
    backgroundColor: '#F5A400',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },

  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },

  modalLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },

  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },

  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },

  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBtnCancel: {
    backgroundColor: '#E5E5EA',
    marginRight: 8,
  },

  modalBtnConfirm: {
    backgroundColor: '#F5A400',
    marginLeft: 8,
  },

  modalBtnCancelText: {
    color: '#333',
    fontWeight: '600',
  },

  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: '600',
  },

});