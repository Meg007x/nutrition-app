import React, { useState, useCallback } from 'react';
import { View, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text'; 
import { styles } from '../../style/profileScreen.styles'; 
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/config';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Brand } from '../../constants/theme';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

interface MenuItem {
  id: number;
  title: string;
  subtitle: string;
  icon: () => React.ReactNode;
  path?: string;
}

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const fetchUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) { setLoading(false); return; }
      const userObj = JSON.parse(userJson);
      const storedUserId = userObj.user_id || userObj.id || userObj._id;
      const response = await fetch(`${BASE_URL}/api/users/profile?userId=${storedUserId}`);
      const json = await response.json();
      if (json.success) setUserData(json.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchUserData(); }, []));

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตเข้าถึงรูปภาพ'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      let avatarData: string;
      if (asset.base64) {
        const mime = asset.mimeType || 'image/jpeg';
        avatarData = `data:${mime};base64,${asset.base64}`;
      } else {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        avatarData = `data:${mime};base64,${b64}`;
      }
      await uploadAvatar(avatarData);
    }
  };

  const uploadAvatar = async (avatarData: string) => {
    setUploadingAvatar(true);
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      const userId = userObj.user_id || userObj.id;

      const response = await fetch(`${BASE_URL}/api/users/profile-picture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatar_url: avatarData }),
      });
      const json = await response.json();
      if (json.success) {
        const savedUrl = json.data?.avatar_url || avatarData;
        // Persist to AsyncStorage so avatar survives screen refocus / app restart
        const updatedUser = { ...userObj, avatar_url: savedUrl };
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUserData((prev: any) => ({ ...prev, avatar_url: savedUrl }));
        Alert.alert('สำเร็จ', 'อัปเดตรูปโปรไฟล์แล้ว');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปโหลดรูปได้');
    } finally { setUploadingAvatar(false); }
  };

  const menuItems: MenuItem[] = [
    { 
      id: 1, 
      title: 'แก้ไขข้อมูลส่วนตัว', 
      subtitle: 'ชื่อผู้ใช้ วันเกิด ส่วนสูง น้ำหนัก รหัสผ่าน', 
      icon: () => <Ionicons name="person" size={24} color="black" />,
      path: '/profile/editProfileScreen' 
    },
    { 
      id: 2, 
      title: 'เป้าหมาย', 
      subtitle: 'ประเภทเป้าหมาย น้ำหนักที่ต้องการ ระยะเวลา', 
      icon: () => <MaterialCommunityIcons name="target" size={24} color="#D32F2F" />,
      path: '/profile/updateGoalScreen' // 👈 เติมที่อยู่หน้าใหม่เข้าไปตรงนี้เลยครับ!
    },
    { 
      id: 3, 
      title: 'ระดับกิจกรรม', 
      subtitle: 'กิจกรรม โปรตีนต่อวัน', 
      icon: () => <FontAwesome5 name="running" size={24} color="#1976D2" />,
      path: '/profile/editActivity'
    },    
// ตรงส่วนของโครงสร้างอาเรย์ข้อมูลปุ่ม
    { 
      id: 4, 
      title: 'อาหารที่แพ้', 
      subtitle: 'ประเภทอาหารที่แพ้', 
      icon: () => <MaterialCommunityIcons name="thumb-down" size={24} color="black" />,
      path: '/profile/editAllergyScreen' // 👈 เติมที่อยู่หน้าใหม่เข้าไปตรงนี้เลยครับ!
    },   
     { id: 5, 
      title: 'อาหารที่ไม่ชอบ', 
      subtitle: 'สิ่งที่ไม่ชอบ', 
      icon: () => <MaterialCommunityIcons name="emoticon-sad" size={24} color={Brand.primary} />,
      path: '/profile/editDislikedFoodScreen' // 👈 เติมที่อยู่หน้าใหม่เข้าไปตรงนี้เลยครับ!
     },
    { id: 6, 
      title: 'อาหารที่สนใจ',
       subtitle: 'หมวดอาหารที่สนใจ', 
       icon: () => <MaterialCommunityIcons name="emoticon-happy" size={24} color="#388E3C" />,
       path: '/profile/editInterestedCuisinesScreen' // 👈 เติมที่อยู่หน้าใหม่เข้าไปตรงนี้เลยครับ! 
      },
    { id: 7, title: 
      'แผนมื้ออาหารและน้ำ', 
      subtitle: 'จำนวนมื้อ เวลา ปริมาณน้ำ', 
      icon: () => <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="black" />,
      path: '/profile/manageMealWaterScreen'
     },
  ];

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={Brand.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.titleText}>โปรไฟล์</ThemedText>

        <View style={styles.userCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.7}>
            <Image 
              source={{ uri: avatarError ? DEFAULT_AVATAR : (userData?.avatar_url || DEFAULT_AVATAR) }} 
              style={[styles.avatar, { resizeMode: 'cover' }]}
              onError={() => setAvatarError(true)}
            />
            {uploadingAvatar && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 30 }}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <ThemedText type="subtitle" style={styles.userName}>
              {userData?.username || 'ไม่พบชื่อผู้ใช้'}
            </ThemedText>
            <ThemedText type="default" style={styles.userStats}>
              {userData?.height_cm || '-'} ซม.  {userData?.weight_kg || '-'} กก.
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7} onPress={handlePickAvatar}>
            <Ionicons name="camera-outline" size={16} color="black" />
            <ThemedText type="defaultSemiBold" style={styles.editButtonText}>แก้ไขรูป</ThemedText>
          </TouchableOpacity>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuCard} 
            activeOpacity={0.7}
            onPress={() => {
              if (item.path) {
                router.push(item.path as any);
              }
            }}
          >
            <View style={styles.menuIconContainer}>
              {item.icon()}
            </View>
            <View style={styles.menuTextContainer}>
              <ThemedText type="defaultSemiBold" style={styles.menuTitle}>{item.title}</ThemedText>
              <ThemedText type="default" style={styles.menuSubtitle}>{item.subtitle}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="black" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;