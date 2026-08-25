import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';

const ORANGE = '#E67E22';
const LIGHT_BG = '#F8F8F8';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [username, setUsername] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [tdee, setTdee] = useState(0);
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);

  useEffect(() => { loadUserIdAndFetchData(); }, []);

  const loadUserIdAndFetchData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) { setLoading(false); return; }
      const userObj = JSON.parse(userJson);
      const storedUserId = userObj.user_id || userObj.id || userObj._id;
      setCurrentUserId(storedUserId);
      fetchProfileData(storedUserId);
    } catch (error) { setLoading(false); }
  };

  const fetchProfileData = async (uid) => {
    try {
      const response = await fetch(BASE_URL + '/api/users/profile?userId=' + uid);
      const json = await response.json();
      if (json.success) {
        const u = json.data;
        setUsername(u.username || '');
        setWeight(u.weight_kg ? u.weight_kg.toString() : '');
        setHeight(u.height_cm ? u.height_cm.toString() : '');
        setTdee(u.health_goals?.tdee_target_kcal || 0);
        setDob(u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '');
        setEmail(u.email || '');
        setGender(u.gender || '');
        setAvatarUrl(u.avatar_url || '');
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets?.length > 0) { await uploadAvatar(result.assets[0].uri); }
  };

  const handleTakeAvatar = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตใช้กล้อง'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets?.length > 0) { await uploadAvatar(result.assets[0].uri); }
  };

  const uploadAvatar = async (uri) => {
    setUploadingAvatar(true);
    try {
      const response = await fetch(BASE_URL + '/api/users/upload-avatar', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, avatar_url: uri })
      });
      const json = await response.json();
      if (json.success) {
        setAvatarUrl(uri);
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) { const u = JSON.parse(userJson); u.avatar_url = uri; await AsyncStorage.setItem('currentUser', JSON.stringify(u)); }
        Alert.alert('สำเร็จ', 'อัปเดตรูปโปรไฟล์แล้ว');
      } else { Alert.alert('ไม่สำเร็จ', json.message || 'เกิดข้อผิดพลาด'); }
    } catch (error) { Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปโหลดรูปได้'); } finally { setUploadingAvatar(false); }
  };

  const showAvatarOptions = () => {
    Alert.alert('รูปโปรไฟล์', 'เลือกแหล่งที่มา', [
      { text: 'ถ่ายรูป', onPress: handleTakeAvatar },
      { text: 'เลือกจากคลัง', onPress: handlePickAvatar },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      const response = await fetch(BASE_URL + '/api/users/update-profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, username, weight_kg: parseFloat(weight) || 0, height_cm: parseFloat(height) || 0, email, gender, date_of_birth: dob })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว!');
        setTdee(json.data.health_goals?.tdee_target_kcal || tdee);
      } else { Alert.alert('บันทึกไม่สำเร็จ', json.message || 'เกิดข้อผิดพลาด'); }
    } catch (error) { Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึก'); } finally { setSaving(false); }
  };

  const handleChangePasswordSubmit = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบอีกครั้ง'); return; }
    try {
      const response = await fetch(BASE_URL + '/api/users/change-password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, password: newPassword })
      });
      const json = await response.json();
      if (json.success) { Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย'); setNewPassword(''); setConfirmPassword(''); setIsPasswordModalVisible(false); }
      else { Alert.alert('ไม่สำเร็จ', json.message || 'กรุณาลองใหม่'); }
    } catch (error) { Alert.alert('ข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์'); }
  };
  if (loading) return <View style={s.loadingContainer}><ActivityIndicator size="large" color={ORANGE} /></View>;
  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}><Ionicons name="chevron-back" size={26} color="#FFF" /></TouchableOpacity>
        <ThemedText style={s.headerTitle}>แก้ไขโปรไฟล์</ThemedText>
        <View style={s.headerBtn} />
      </View>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.8}>
            <View style={s.avatarWrapper}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatar} /> : <View style={s.avatarPlaceholder}><Ionicons name="person" size={48} color="#CCC" /></View>}
              <View style={s.cameraBadge}>{uploadingAvatar ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={16} color="#FFF" />}</View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={showAvatarOptions}><ThemedText style={s.changePhotoText}>เปลี่ยนรูปโปรไฟล์</ThemedText></TouchableOpacity>
        </View>
        <View style={s.inputGroup}><ThemedText style={s.label}>ชื่อผู้ใช้</ThemedText><TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="กรอกชื่อ" /></View>
        <View style={s.row}>
          <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}><ThemedText style={s.label}>น้ำหนัก (kg)</ThemedText><TextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="numeric" /></View>
          <View style={[s.inputGroup, { flex: 1, marginLeft: 8 }]}><ThemedText style={s.label}>ส่วนสูง (cm)</ThemedText><TextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="numeric" /></View>
        </View>
        <View style={s.infoCard}><MaterialCommunityIcons name="fire" size={22} color={ORANGE} /><View style={{ marginLeft: 12, flex: 1 }}><ThemedText style={s.infoLabel}>TDEE</ThemedText><ThemedText style={s.infoValue}>{tdee ? tdee.toLocaleString() : '—'} แคลอรี่/วัน</ThemedText></View></View>
        <View style={s.inputGroup}><ThemedText style={s.label}>วันเกิด</ThemedText><TextInput style={s.input} value={dob} onChangeText={setDob} placeholder="2004-05-14" /></View>
        <View style={s.inputGroup}><ThemedText style={s.label}>อีเมล</ThemedText><TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
        <View style={s.inputGroup}><ThemedText style={s.label}>เพศ</ThemedText><View style={s.genderRow}>{["ชาย", "หญิง"].map((g) => (<TouchableOpacity key={g} style={[s.genderBtn, gender === g && s.genderBtnActive]} onPress={() => setGender(g)}><ThemedText style={[s.genderText, gender === g && s.genderTextActive]}>{g}</ThemedText></TouchableOpacity>))}</View></View>
        <TouchableOpacity style={s.passwordRow} onPress={() => setIsPasswordModalVisible(true)}><Ionicons name="lock-closed-outline" size={20} color="#666" /><ThemedText style={s.passwordText}>เปลี่ยนรหัสผ่าน</ThemedText><Ionicons name="chevron-forward" size={20} color="#CCC" /></TouchableOpacity>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <ThemedText style={s.saveBtnText}>บันทึกข้อมูล</ThemedText>}</TouchableOpacity>
      </ScrollView>
      <Modal visible={isPasswordModalVisible} transparent animationType="fade"><View style={s.modalOverlay}><View style={s.modalContainer}>
        <View style={s.modalHeader}><Ionicons name="lock-closed" size={22} color={ORANGE} /><ThemedText style={s.modalTitle}>เปลี่ยนรหัสผ่าน</ThemedText></View>
        <ThemedText style={s.modalLabel}>รหัสผ่านใหม่</ThemedText><View style={s.modalInputWrapper}><TextInput style={s.modalInput} secureTextEntry={!showModalPassword} value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" /><TouchableOpacity onPress={() => setShowModalPassword(!showModalPassword)}><Ionicons name={showModalPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity></View>
        <ThemedText style={s.modalLabel}>ยืนยันรหัสผ่าน</ThemedText><View style={s.modalInputWrapper}><TextInput style={s.modalInput} secureTextEntry={!showModalPassword} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" /><TouchableOpacity onPress={() => setShowModalPassword(!showModalPassword)}><Ionicons name={showModalPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity></View>
        <View style={s.modalBtnRow}><TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => { setNewPassword(''); setConfirmPassword(''); setIsPasswordModalVisible(false); }}><ThemedText style={s.modalBtnCancelText}>ยกเลิก</ThemedText></TouchableOpacity><TouchableOpacity style={[s.modalBtn, s.modalBtnConfirm]} onPress={handleChangePasswordSubmit}><ThemedText style={s.modalBtnConfirmText}>ยืนยัน</ThemedText></TouchableOpacity></View>
      </View></View></Modal>
    </SafeAreaView>
  );

}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: LIGHT_BG },
  headerBar: { height: 56, backgroundColor: ORANGE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: ORANGE },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#DDD' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  changePhotoText: { color: ORANGE, fontSize: 14, marginTop: 8, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 16, color: '#222' },
  row: { flexDirection: 'row', marginBottom: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  genderBtnActive: { borderColor: ORANGE, backgroundColor: '#FFF5E6' },
  genderText: { fontSize: 16, color: '#666' },
  genderTextActive: { color: ORANGE, fontWeight: 'bold' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  passwordText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#333' },
  saveBtn: { backgroundColor: ORANGE, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 340, backgroundColor: '#FFF', borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  modalLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '600' },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 10, paddingHorizontal: 12, height: 46, marginBottom: 16, backgroundColor: '#F9F9F9' },
  modalInput: { flex: 1, fontSize: 15, color: '#000' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#E5E5EA', marginRight: 8 },
  modalBtnConfirm: { backgroundColor: ORANGE, marginLeft: 8 },
  modalBtnCancelText: { color: '#333', fontWeight: '600' },
  modalBtnConfirmText: { color: '#FFF', fontWeight: '600' },
});