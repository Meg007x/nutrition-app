import { useEffect } from 'react';
import { Stack } from "expo-router";
import { Text, TextInput } from 'react-native'; // 👈 อย่าลืม import Text กับ TextInput
import { useFonts, NotoSansThai_400Regular, NotoSansThai_700Bold } from '@expo-google-fonts/noto-sans-thai';
import * as SplashScreen from 'expo-splash-screen';

// ดึงหน้า Splash Screen ไว้ก่อน รอจนกว่าฟอนต์จะโหลดเสร็จ
SplashScreen.preventAutoHideAsync();

// 🪄 === เริ่มต้นวิชามาร: บังคับฟอนต์ให้ Text และ TextInput ทั้งแอป! === 🪄
const customTextProps = Text as any;
customTextProps.defaultProps = customTextProps.defaultProps || {};
customTextProps.defaultProps.style = { fontFamily: 'NotoSansThai' };

const customTextInputProps = TextInput as any;
customTextInputProps.defaultProps = customTextInputProps.defaultProps || {};
customTextInputProps.defaultProps.style = { fontFamily: 'NotoSansThai' };
// =========================================================

export default function RootLayout() {
  // 1. โหลดฟอนต์เข้าโปรเจกต์
  const [loaded] = useFonts({
    NotoSansThai: NotoSansThai_400Regular,
    NotoSansThaiBold: NotoSansThai_700Bold,
  });

  // 2. ถ้าโหลดเสร็จแล้ว ค่อยเอา Splash Screen ลง
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 3. ถ้ายังโหลดไม่เสร็จ ให้รอไปก่อน
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