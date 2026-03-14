import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Text, TextInput } from 'react-native';
import {
  useFonts,
  NotoSansThai_400Regular,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';
import * as SplashScreen from 'expo-splash-screen';
import { RegisterProvider } from '../context/register-context';

SplashScreen.preventAutoHideAsync();

const customTextProps = Text as any;
customTextProps.defaultProps = customTextProps.defaultProps || {};
customTextProps.defaultProps.style = { fontFamily: 'NotoSansThai' };

const customTextInputProps = TextInput as any;
customTextInputProps.defaultProps = customTextInputProps.defaultProps || {};
customTextInputProps.defaultProps.style = { fontFamily: 'NotoSansThai' };

export default function RootLayout() {
  const [loaded] = useFonts({
    NotoSansThai: NotoSansThai_400Regular,
    NotoSansThaiBold: NotoSansThai_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <RegisterProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="weekly" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </RegisterProvider>
  );
}