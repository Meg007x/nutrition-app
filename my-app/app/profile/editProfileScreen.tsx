import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  TextInput,
  Modal,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { styles } from '@/style/editProfile.styles'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../constants/config';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  
  // 🟢 State ข้อมูลฟอร์มหลัก (ให้แก้ไขได้ทุกค่า)
  const [username, setUsername] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [tdee, setTdee] = useState(0);
  const [dob, setDob] = useState(''); // เพิ่มกล่องใส่ วันเกิด (เช่น ค.ศ. หรือข้อความ)
  const [email, setEmail] = useState(''); // เปิดให้อัปเดตอีเมลได้
  const [gender, setGender] = useState(''); // เพิ่มให้กรอกหรือแก้ไขเพศได้

  // 🔒 State สำหรับจัดการ Popup เปลี่ยนรหัสผ่าน (Modal)
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);

  useEffect(() => {
    loadUserIdAndFetchData();
  }, []);

  const loadUserIdAndFetchData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) {
        console.warn("ไม่พบข้อมูล currentUser");
        setLoading(false);
        return;
      }
      
      const userObj = JSON.parse(userJson);
      const storedUserId = userObj.user_id || userObj.id || userObj._id;
      
      setCurrentUserId(storedUserId); 
      fetchProfileData(storedUserId);
    } catch (error) {
      console.error("Error loading user ID:", error);
      setLoading(false);
    }
  };

  const fetchProfileData = async (userIdToFetch: string) => {
    try {
      // ⚠️ แนะนำให้เปลี่ยน localhost เป็นเลข IP เครื่องคอมพิวเตอร์ของคุณถ้าทดสอบผ่านแอปบนมือถือจริง
      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${userIdToFetch}`);
      const json = await response.json();
      if (json.success) {
        const u = json.data;
        setUsername(u.username || '');
        setWeight(u.weight_kg ? u.weight_kg.toString() : '');
        setHeight(u.height_cm ? u.height_cm.toString() : '');
        setTdee(u.health_goals?.tdee_target_kcal || 0);
        // เก็บรูปแบบวันที่เป็น string เพื่อให้พิมพ์แก้ไขในฟิลด์ได้ง่ายขึ้น หรือนำมาตั้งต้น
        setDob(u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : '');
        setEmail(u.email || '');
        setGender(u.gender || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 ฟังก์ชันบันทึกข้อมูลหลักทั้งหมด
  const handleSave = async () => {
    if (!currentUserId) return; 

    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId, 
          username,
          weight_kg: parseFloat(weight) || 0,
          height_cm: parseFloat(height) || 0,
          email,        // 👈 ส่งค่าอีเมลไปบันทึกที่หลังบ้าน
          gender,       // 👈 ส่งค่าเพศไปบันทึกที่หลังบ้าน
          date_of_birth: dob // 👈 ส่งข้อมูลวันเกิดที่คุณแก้ไขไปบันทึก
        })
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว!');
        setTdee(json.data.health_goals?.tdee_target_kcal || tdee);
        
        // อัปเดตข้อมูลในคลัง currentUser บนเครื่องเพื่อให้หน้าอื่นๆ ดึงค่าล่าสุดไปใช้ถูก
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) {
          const userObj = JSON.parse(userJson);
          const updatedUser = { ...userObj, username, email };
          await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      } else {
        Alert.alert('บันทึกไม่สำเร็จ', json.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  // 🔒 ฟังก์ชันเปลี่ยนรหัสผ่านหลังตรวจสอบ Popup เสร็จสิ้น
  const handleChangePasswordSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    try {
      // ยิง API ไปหลังบ้านสำหรับเปลี่ยนรหัสผ่านโดยเฉพาะ
      const response = await fetch(`${BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          password: newPassword
        })
      });
      const json = await response.json();

      if (json.success) {
        Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเสร็จสิ้นเรียบร้อยแล้ว");
        // เคลียร์ค่าในกล่อง
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalVisible(false); // ปิด Popup ล็อคหน้าจอ
      } else {
        Alert.alert("เปลี่ยนรหัสผ่านไม่สำเร็จ", json.message || "กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อเปลี่ยนรหัสผ่านได้");
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E67E22" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => {
          if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur(); 
          }
          router.back(); 
        }}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>โปรไฟล์/แก้ไขข้อมูลส่วนตัว</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* รูปโปรไฟล์และชื่อ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.avatar} />
          </View>
         
          <View style={styles.nameRow}>
            <ThemedText style={{ fontSize: 22, fontWeight: 'bold', color: '#000' }}>คุณ </ThemedText>
            <TextInput 
              style={styles.nameInput}
              value={username}
              onChangeText={setUsername}
              placeholder="ชื่อของคุณ"
            />
            <Ionicons name="pencil" size={20} color="black" style={{ marginLeft: 4 }} />
          </View>
          <ThemedText style={styles.emailSub}>{email}</ThemedText>
        </View>

        {/* 📦 กล่อง น้ำหนัก / ส่วนสูง */}
        <View style={styles.rowWeightHeight}>
          <View style={styles.measurementBox}>
            <ThemedText style={styles.boxLabel}>น้ำหนัก</ThemedText>
            <View style={styles.numberSelector}>
              <TextInput 
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <View style={styles.unitContainer}>
                <Ionicons name="swap-vertical" size={18} color="#007AFF" />
                <ThemedText style={styles.unitTextWeight}>kg</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.measurementBox}>
            <ThemedText style={styles.boxLabel}>ส่วนสูง</ThemedText>
            <View style={styles.numberSelector}>
              <TextInput 
                style={styles.heightInput}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
              <View style={styles.unitContainer}>
                <Ionicons name="swap-vertical" size={18} color="#34C759" />
                <ThemedText style={styles.unitTextHeight}>cm</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* รายการข้อมูลด้านล่างที่ขยายให้แก้ไขพิมพ์ค่าเข้าไปได้ทั้งหมด */}
        <View style={styles.infoRowItem}>
          <MaterialCommunityIcons name="chart-pie" size={28} color="#00E676" />
          <View style={styles.infoTextGroup}>
            <ThemedText style={styles.infoLabel}>TDEE (คำนวณอัตโนมัติ)</ThemedText>
            <ThemedText style={styles.infoValue}>{tdee.toLocaleString()} แคลอรี่ต่อวัน</ThemedText>
          </View>
        </View>

        {/* 🟢 แก้ไขวันเกิดได้ */}
        <View style={styles.infoRowItem}>
          <MaterialCommunityIcons name="calendar" size={28} color="#FF7043" />
          <View style={styles.infoTextGroup}>
            <ThemedText style={styles.infoLabel}>วันเกิด (ปปปป-ดด-วว)</ThemedText>
            <TextInput
              style={{ fontSize: 16, color: '#000', padding: 0, marginTop: 2 }}
              value={dob}
              onChangeText={setDob}
              placeholder="ตัวอย่าง 2004-05-14"
            />
          </View>
        </View>

        {/* 🟢 แก้ไขอีเมลได้ */}
        <View style={styles.infoRowItem}>
          <MaterialCommunityIcons name="email" size={28} color="#29B6F6" />
          <View style={styles.infoTextGroup}>
            <ThemedText style={styles.infoLabel}>อีเมล</ThemedText>
            <TextInput
              style={{ fontSize: 16, color: '#000', padding: 0, marginTop: 2 }}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 🟢 แก้ไขเพศได้ */}
        <View style={styles.infoRowItem}>
          <MaterialCommunityIcons name="gender-male-female" size={28} color="#5C6BC0" />
          <View style={styles.infoTextGroup}>
            <ThemedText style={styles.infoLabel}>เพศ (ชาย / หญิง)</ThemedText>
            <TextInput
              style={{ fontSize: 16, color: '#000', padding: 0, marginTop: 2 }}
              value={gender}
              onChangeText={setGender}
              placeholder="กรอก ชาย หรือ หญิง"
            />
          </View>
        </View>

        {/* 🔒 ส่วนของรหัสผ่าน: กดแล้วจะเปิดเด้ง Popup ทันทีตามที่คุณต้องการ */}
        <TouchableOpacity 
          style={styles.infoRowItem} 
          onPress={() => setIsPasswordModalVisible(true)}
        >
          <MaterialCommunityIcons name="lock" size={28} color="#78909C" />
          <View style={styles.infoTextGroup}>
            <ThemedText style={styles.infoLabel}>รหัสผ่าน</ThemedText>
            <ThemedText style={{ fontSize: 14, color: '#007AFF', fontWeight: 'bold', marginTop: 2 }}>
              กดที่นี่เพื่อเปลี่ยนรหัสผ่านตัวใหม่
            </ThemedText>
          </View>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tdeeHelpRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={28} color="black" />
          <ThemedText style={styles.helpText}>TDEE คืออะไร ?</ThemedText>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* ปุ่มบันทึกข้อมูลทั้งหมด */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <ThemedText style={styles.saveButtonText}>บันทึกข้อมูลโปรไฟล์</ThemedText>}
        </TouchableOpacity>
      </ScrollView>

      {/* 🔒 ================== POPUP (MODAL) สำหรับเปลี่ยนรหัสผ่านผู้ใช้ ================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPasswordModalVisible}
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContainer}>
            <View style={localStyles.modalHeader}>
              <MaterialCommunityIcons name="shield-lock" size={26} color="#E67E22" />
              <ThemedText style={localStyles.modalTitle}>ตั้งค่ารหัสผ่านใหม่</ThemedText>
            </View>

            <ThemedText style={localStyles.modalLabel}>รหัสผ่านใหม่</ThemedText>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={localStyles.modalInput}
                placeholder="กรอกรหัสผ่านใหม่"
                secureTextEntry={!showModalPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowModalPassword(!showModalPassword)}>
                <Ionicons name={showModalPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ThemedText style={localStyles.modalLabel}>ยืนยันรหัสผ่านใหม่อีกครั้ง</ThemedText>
            <View style={localStyles.inputWrapper}>
              <TextInput
                style={localStyles.modalInput}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                secureTextEntry={!showModalPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            {/* ปุ่มกดกดยืนยัน หรือยกเลิก */}
            <View style={localStyles.modalButtonRow}>
              <TouchableOpacity 
                style={[localStyles.modalButton, localStyles.btnCancel]} 
                onPress={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsPasswordModalVisible(false);
                }}
              >
                <ThemedText style={localStyles.btnTextCancel}>ยกเลิก</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[localStyles.modalButton, localStyles.btnConfirm]} 
                onPress={handleChangePasswordSubmit}
              >
                <ThemedText style={localStyles.btnTextConfirm}>ยืนยันการเปลี่ยน</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// สไตล์ตกแต่งภายในสำหรับตัวหน้าต่างเด้ง Popup รหัสผ่าน (Modal)
const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
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
    color: '#333'
  },
  modalLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
    backgroundColor: '#F9F9F9'
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#E5E5EA',
    marginRight: 8,
  },
  btnConfirm: {
    backgroundColor: '#E67E22',
    marginLeft: 8,
  },
  btnTextCancel: {
    color: '#333',
    fontWeight: '600',
  },
  btnTextConfirm: {
    color: '#FFF',
    fontWeight: '600',
  },
});