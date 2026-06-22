import React, { useState, useCallback } from 'react';
import { View, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text'; 
import { styles } from '../../style/profileScreen.styles'; 
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          // 🟢 1. ไปดึงกล่องข้อมูลชื่อ "currentUser" ที่หน้า Login เซฟไว้
          const userJson = await AsyncStorage.getItem('currentUser');
          
          if (!userJson) {
            console.warn("ไม่พบข้อมูล currentUser");
            setLoading(false);
            return;
          }

          // 🟢 2. แกะกล่อง JSON ออกมาเป็น Object แล้วดึง user_id ออกมา
          const userObj = JSON.parse(userJson);
          const storedUserId = userObj.user_id || userObj.id || userObj._id; 

          // ⚠️ อย่าลืมเปลี่ยน localhost เป็น IP เครื่องนะครับ
          const response = await fetch(`http://localhost:3000/api/users/profile?userId=${storedUserId}`);
          const json = await response.json();
          if (json.success) {
            setUserData(json.data); 
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [])
  );

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
      icon: () => <MaterialCommunityIcons name="emoticon-sad" size={24} color="#F57C00" />,
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
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#E67E22" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.titleText}>โปรไฟล์</ThemedText>

        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatar} 
            />
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="subtitle" style={styles.userName}>
              {userData?.username || 'ไม่พบชื่อผู้ใช้'}
            </ThemedText>
            <ThemedText type="default" style={styles.userStats}>
              {userData?.height_cm || '-'} ซม.  {userData?.weight_kg || '-'} กก.
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
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