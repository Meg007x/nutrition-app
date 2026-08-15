import { Stack } from "expo-router";
import { RegisterProvider } from "../../context/register-context";

export default function RegisterLayout() {
  return (
    <RegisterProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="step1" />
        <Stack.Screen name="step2" />
        <Stack.Screen name="step3" />
        <Stack.Screen name="step4" />
        <Stack.Screen name="step5" />
        <Stack.Screen name="step5-1" />
        <Stack.Screen name="step6-1" />
        <Stack.Screen name="step6-2" />
        <Stack.Screen name="step7" />
        <Stack.Screen name="step8" />
        <Stack.Screen name="step9" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="summary" />
      </Stack>
    </RegisterProvider>
  );
}