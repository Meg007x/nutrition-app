import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { styles as s } from '../../style/editProfile.styles';

const ORANGE = "#F5A400";

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [authToken, setAuthToken] = useState('');
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);

  const fetchProfileData = useCallback(async (uid: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${encodeURIComponent(uid)}`);
      const json = await response.json();
      if (json.success) {
        const u = json.data;
        setUsername(u.username || '');
        setWeight(u.weight_kg ? u.weight_kg.toString() : '');
        setHeight(u.height_cm ? u.height_cm.toString() : '');
        setTdee(u.health_goals?.tdee_target_kcal || 0);
        setDob(u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '');
        setEmail(u.email || '');
        setGender(
          u.gender === 'หญิง' || u.gender === 'female'
            ? 'หญิง'
            : u.gender === 'ชาย' || u.gender === 'male'
              ? 'ชาย'
              : ''
        );
        setAvatarUrl(u.avatar_url || '');
      }
    } catch (error) {
      console.error('Unable to fetch profile:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserIdAndFetchData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) {
        setLoading(false);
        return;
      }
      const userObj = JSON.parse(userJson);
      const storedUserId = userObj.user_id || userObj.id || userObj._id;
      if (!storedUserId || !userObj.access_token) {
        setLoading(false);
        Alert.alert('กรุณาเข้าสู่ระบบใหม่', 'เซสชันไม่ถูกต้องหรือหมดอายุ');
        router.replace('/login');
        return;
      }
      setCurrentUserId(String(storedUserId));
      setAuthToken(userObj.access_token);
      await fetchProfileData(String(storedUserId));
    } catch (error) {
      console.error('Unable to load current user:', error);
      setLoading(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
  }, [fetchProfileData, router]);

  useEffect(() => {
    void loadUserIdAndFetchData();
  }, [loadUserIdAndFetchData]);

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Unable to open photo library:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดคลังรูปภาพได้');
    }
  };

  const handleTakeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตใช้กล้อง');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Unable to open camera:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดกล้องได้');
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      // Convert local URI to base64 for database storage
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const avatarData = `data:${mimeType};base64,${base64}`;

      const response = await fetch(BASE_URL + '/api/users/upload-avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ avatar_url: avatarData })
      });
      const json = await response.json();
      if (json.success) {
        const savedAvatar = json.data?.avatar_url || avatarData;
        setAvatarUrl(savedAvatar);
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) { const u = JSON.parse(userJson); u.avatar_url = savedAvatar; await AsyncStorage.setItem('currentUser', JSON.stringify(u)); }
        Alert.alert('สำเร็จ', 'อัปเดตรูปโปรไฟล์แล้ว');
      } else { Alert.alert('ไม่สำเร็จ', json.message || 'เกิดข้อผิดพลาด'); }
    } catch (error) {
      console.error('Unable to upload avatar:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปโหลดรูปได้');
    } finally { setUploadingAvatar(false); }
  };

  const handleSave = async () => {
    if (!currentUserId || !authToken) {
      Alert.alert('กรุณาเข้าสู่ระบบใหม่', 'เซสชันไม่ถูกต้องหรือหมดอายุ');
      return;
    }
    const parsedWeight = Number(weight);
    const parsedHeight = Number(height);
    const birthDate = new Date(`${dob}T00:00:00.000Z`);
    if (!username.trim()) {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกชื่อผู้ใช้');
      return;
    }
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || !Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'น้ำหนักและส่วนสูงต้องเป็นตัวเลขที่มากกว่า 0');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== dob || birthDate > new Date()) {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกวันเกิดในรูปแบบ YYYY-MM-DD และต้องไม่เป็นวันในอนาคต');
      return;
    }
    if (gender !== 'ชาย' && gender !== 'หญิง') {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณาเลือกเพศ');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(BASE_URL + '/api/users/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ username: username.trim(), weight_kg: parsedWeight, height_cm: parsedHeight, email: email.trim(), gender, date_of_birth: dob })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว!');
        setTdee(json.data.health_goals?.tdee_target_kcal || tdee);
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) {
          await AsyncStorage.setItem('currentUser', JSON.stringify({ ...JSON.parse(userJson), ...json.data }));
        }
      } else { Alert.alert('บันทึกไม่สำเร็จ', json.message || 'เกิดข้อผิดพลาด'); }
    } catch (error) {
      console.error('Unable to save profile:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally { setSaving(false); }
  };

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ให้ครบ'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบอีกครั้ง'); return; }
    try {
      const response = await fetch(BASE_URL + '/api/users/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ currentPassword, password: newPassword })
      });
      const json = await response.json();
      if (json.success) { Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setIsPasswordModalVisible(false); }
      else { Alert.alert('ไม่สำเร็จ', json.message || 'กรุณาลองใหม่'); }
    } catch (error) {
      console.error('Unable to change password:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์');
    }
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
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
            <View style={s.avatarWrapper}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatar} /> : <View style={s.avatarPlaceholder}><Ionicons name="person" size={48} color="#CCC" /></View>}
              <View style={s.cameraBadge}>{uploadingAvatar ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={16} color="#FFF" />}</View>
            </View>
          </TouchableOpacity>
          <View style={s.avatarActions}>
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={s.avatarActionButton}>
              <ThemedText style={s.changePhotoText}>เลือกจากคลังรูปภาพ</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakeAvatar} disabled={uploadingAvatar} style={s.avatarActionButton}>
              <ThemedText style={s.changePhotoText}>ถ่ายรูป</ThemedText>
            </TouchableOpacity>
          </View>
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
        <ThemedText style={s.modalLabel}>รหัสผ่านปัจจุบัน</ThemedText><View style={s.modalInputWrapper}><TextInput style={s.modalInput} secureTextEntry={!showModalPassword} value={currentPassword} onChangeText={setCurrentPassword} autoCapitalize="none" autoComplete="current-password" /></View>
        <ThemedText style={s.modalLabel}>รหัสผ่านใหม่</ThemedText><View style={s.modalInputWrapper}><TextInput style={s.modalInput} secureTextEntry={!showModalPassword} value={newPassword} onChangeText={setNewPassword} autoCapitalize="none" /><TouchableOpacity onPress={() => setShowModalPassword(!showModalPassword)}><Ionicons name={showModalPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity></View>
        <ThemedText style={s.modalLabel}>ยืนยันรหัสผ่าน</ThemedText><View style={s.modalInputWrapper}><TextInput style={s.modalInput} secureTextEntry={!showModalPassword} value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" /><TouchableOpacity onPress={() => setShowModalPassword(!showModalPassword)}><Ionicons name={showModalPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" /></TouchableOpacity></View>
        <View style={s.modalBtnRow}><TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setIsPasswordModalVisible(false); }}><ThemedText style={s.modalBtnCancelText}>ยกเลิก</ThemedText></TouchableOpacity><TouchableOpacity style={[s.modalBtn, s.modalBtnConfirm]} onPress={handleChangePasswordSubmit}><ThemedText style={s.modalBtnConfirmText}>ยืนยัน</ThemedText></TouchableOpacity></View>
      </View></View></Modal>
    </SafeAreaView>
  );
}