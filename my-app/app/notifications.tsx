import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView, 
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// นำเข้าคอมโพเนนต์ฟอนต์ภาษาไทยของทีม
import { ThemedText } from '../components/themed-text'; 
// นำเข้าไฟล์สไตล์แยก
import { styles, ORANGE } from "../style/notifications.style";
import { BASE_URL } from "../constants/config";

interface NotificationItem {
  _id: string;
  type: 'water' | 'streak' | 'meal';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface GroupedNotifications {
  today: NotificationItem[];
  yesterday: NotificationItem[];
  older: NotificationItem[];
}

const TYPE_ICONS = {
  water: '💧',
  streak: '🔥',
  meal: '🍽️',
};

export default function NotificationScreen() {
  // 🟢 แก้ไขบั๊ก [Cannot find name 'userId']: ประกาศตัวแปรรับไอดีตรงนี้ 
  // (ในอนาคตเปลี่ยนเป็นดึงจาก Global Context หรือ Auth State ของระบบได้เลยครับ)
  const userId = "U1774508285129";

  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<GroupedNotifications>({
    today: [],
    yesterday: [],
    older: []
  });

  // 1. ดึงข้อมูลแจ้งเตือนจากหลังบ้านจริง
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // เปลี่ยน URL เป็นของหลังบ้านคุณ และใส่ userId จริงลงไป
      const response = await fetch(`${BASE_URL}/api/notifications?userId=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.data); // ดึงข้อมูล today, yesterday, older เข้า state
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันกดลบแจ้งเตือน ยิงตรงไปลบใน MongoDB
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        // ลบสำเร็จ ให้ดึงข้อมูลใหม่มาโชว์ทันที
        fetchNotifications();
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  // 3. ฟังก์ชันกดที่กล่องแจ้งเตือนแล้วเด้งไปหน้าบันทึกทันที
  const handleNotificationPress = (type: 'water' | 'streak' | 'meal') => {
    if (type === 'water') {
      router.push("/water-log"); // ไปหน้าบันทึกน้ำ
    } else if (type === 'meal') {
      router.push("/scan");  // ไปหน้าบันทึกอาหาร / สแกนอาหาร
    } else {
      router.push("/dashboard"); // อื่นๆ กลับไปแดชบอร์ด
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderNotificationCard = (item: NotificationItem) => {
    return (
      <TouchableOpacity 
        key={item._id} 
        style={[styles.card, !item.isRead && styles.unreadCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item.type)} // 👈 ผูกคำสั่งกดที่การ์ดเพื่อวิ่งไปหน้าบันทึก
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.iconText}>{TYPE_ICONS[item.type] || '🔔'}</ThemedText>
          </View>
          <View style={[styles.contentContainer, { flex: 1, marginRight: 8 }]}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 15, marginBottom: 4, color: '#111111' }}>
              {item.title}
            </ThemedText>
            <ThemedText type="default" style={{ fontSize: 13, color: '#6E6E6E' }} numberOfLines={2}>
              {item.message}
            </ThemedText>
          </View>
        </View>

        {/* 🛠️ โซนขวา: จุดแจ้งเตือน และ ปุ่มกดลบ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {!item.isRead && <View style={styles.unreadDot} />}
          
          {/* ❌ เพิ่มปุ่มกากบาทกดลบการแจ้งเตือนนี้ออกจากระบบหลังบ้าน */}
          <TouchableOpacity 
            style={{ padding: 6 }} 
            onPress={(e) => {
              e.stopPropagation(); // 👈 ป้องกันไม่ให้กดลบแล้วกลายเป็นการกดเปิดลิงก์หน้านั้นๆ ซ้อนกัน
              handleDelete(item._id);
            }}
          >
            <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: NotificationItem[]) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 14, color: '#6E6E6E', marginLeft: 16, marginBottom: 8 }}>
          {title}
        </ThemedText>
        {items.map(item => renderNotificationCard(item))}
      </View>
    );
  };

  // ตรวจสอบว่าไม่มีข้อมูลเลยในทุกหมวดหมู่หรือไม่
  const isEmpty = !notifications.today?.length && 
                  !notifications.yesterday?.length && 
                  !notifications.older?.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      
      {/* 🟠 1. แถบเลย์เอาท์ด้านบนสีส้ม (Header) ตามรูปดีไซน์เป๊ะๆ */}
      <View style={{ backgroundColor: '#F28A1A', paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16 }}>
        {/* แถบสถานะจำลองด้านบนสุด */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF', fontSize: 14 }}>9:41</ThemedText>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <Ionicons name="cellular" size={16} color="#FFFFFF" />
            <Ionicons name="wifi" size={16} color="#FFFFFF" />
            <Ionicons name="battery-full" size={16} color="#FFFFFF" />
          </View>
        </View>
        {/* หัวข้อหน้าจอ */}
        <ThemedText type="title" style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
          แจ้งเตือน
        </ThemedText>
      </View>

      {/* 📜 ส่วนเนื้อหาตรงกลาง (แสดงข้อมูล หรือ แสดงหน้าว่างเปล่า) */}
      <View style={{ flex: 1, backgroundColor: '#F4F4F4' }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F28A1A" />
            <ThemedText type="default" style={{ marginTop: 10, color: '#6E6E6E' }}>กำลังโหลด...</ThemedText>
          </View>
        ) : isEmpty ? (
          /* 📌 ถ้าไม่มีข้อมูลเลย: โครงสร้างบน-ล่างยังอยู่ครบ แต่ตรงกลางจะขึ้นว่าไม่มีการแจ้งเตือน */
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
            <Ionicons name="notifications-off-outline" size={64} color="#D4D4D4" />
            <ThemedText type="subtitle" style={{ color: '#111111', marginTop: 16, textAlign: 'center' }}>
              ไม่มีการแจ้งเตือนในขณะนี้
            </ThemedText>
            <ThemedText type="default" style={{ color: '#6E6E6E', marginTop: 8, textAlign: 'center', fontSize: 14 }}>
              ประวัติและข้อมูลการแจ้งเตือนของคุณจะแสดงขึ้นที่นี่เมื่อมีอัปเดตใหม่
            </ThemedText>
          </View>
        ) : (
          /* 🎉 ถ้ามีข้อมูล: วนลูปการ์ดข้อมูลแสดงผล */
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {renderSection('วันนี้', notifications.today)}
            {renderSection('เมื่อวาน', notifications.yesterday)}
            {renderSection('ก่อนหน้านี้', notifications.older)}
            <View style={{ height: 30 }} /> 
          </ScrollView>
        )}
      </View>

      {/* 🧭 2. แถบเมนูด้านล่าง (Bottom Tab Navigation) ถอดแบบจากไฟล์แดชบอร์ด */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        backgroundColor: '#FFFBEF', 
        borderTopWidth: 1, 
        borderTopColor: '#EFEFEF', 
        paddingVertical: 10 
      }}>
        <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.replace("/dashboard")}>
          <Ionicons name="home-outline" size={22} color="#666" />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 11, marginTop: 4, color: '#666' }}>แดชบอร์ด</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={22} color="#666" />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 11, marginTop: 4, color: '#666' }}>บันทึก</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Ionicons name="camera-outline" size={22} color="#666" />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 11, marginTop: 4, color: '#666' }}>สแกน</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Ionicons name="calculator-outline" size={22} color="#666" />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 11, marginTop: 4, color: '#666' }}>แผน</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Ionicons name="person-outline" size={22} color="#666" />
          <ThemedText type="defaultSemiBold" style={{ fontSize: 11, marginTop: 4, color: '#666' }}>โปรไฟล์</ThemedText>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}