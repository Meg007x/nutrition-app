import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput, Alert, Platform } from 'react-native';
import {
  useFonts,
  NotoSansThai_400Regular,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/config';

SplashScreen.preventAutoHideAsync();

const customTextProps = Text as any;
customTextProps.defaultProps = customTextProps.defaultProps || {};
customTextProps.defaultProps.style = { fontFamily: 'NotoSansThai' };

const customTextInputProps = TextInput as any;
customTextInputProps.defaultProps = customTextInputProps.defaultProps || {};
customTextInputProps.defaultProps.style = { fontFamily: 'NotoSansThai' };

// Water intake reminder on app open — fires once per app session
const WATER_REMINDER_KEY = 'last_water_reminder_shown';

async function triggerWaterReminderOnAppOpen() {
  try {
    const userJson = await AsyncStorage.getItem('currentUser');
    if (!userJson) return;
    const user = JSON.parse(userJson);
    const userId = user.user_id;
    if (!userId) return;

    // Check if we already showed the reminder in this session
    const lastShown = await AsyncStorage.getItem(WATER_REMINDER_KEY);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    if (lastShown === todayStr) return; // Already shown today

    // Only trigger between 8:00 - 22:00
    const hour = now.getHours();
    if (hour < 8 || hour >= 22) return;

    // Create a water notification in backend
    try {
      await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'water',
          title: '💧 อย่าลืมดื่มน้ำ!',
          message: 'ดื่มน้ำสักแก้วเพื่อสุขภาพที่ดีของคุณกันเถอะ!',
        }),
      });
    } catch (apiErr) {
      // Silent fail for notification creation
    }

    // Show instant alert to user
    Alert.alert(
      '💧 อย่าลืมดื่มน้ำ!',
      'ดื่มน้ำสักแก้วเพื่อสุขภาพที่ดีของคุณกันเถอะ!',
      [{ text: 'รับทราบ', style: 'default' }]
    );

    // Mark as shown today
    await AsyncStorage.setItem(WATER_REMINDER_KEY, todayStr);
  } catch (error) {
    // Silent fail — don't block app startup
    console.log('Water reminder trigger skipped:', error);
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    NotoSansThai: NotoSansThai_400Regular,
    NotoSansThaiBold: NotoSansThai_700Bold,
  });
  const hasTriggeredWater = useRef(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Trigger water reminder once per app session
      if (!hasTriggeredWater.current) {
        hasTriggeredWater.current = true;
        // Small delay to let the app fully render first
        setTimeout(() => triggerWaterReminderOnAppOpen(), 2000);
      }
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="weekly" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}