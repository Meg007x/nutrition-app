import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

const COLORS = {
  bg: "#F5EFD8",
  border: "#E2D8B5",
  inactive: "#7A7A7A",
  dashboard: "#F28A1A",
  record: "#4E86E8",
  scan: "#111111",
  plan: "#4E86E8",
  profile: "#4E86E8",
};

function TabIcon({
  name,
  outlineName,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: `${color}20` }]}>
      <Ionicons
        name={focused ? name : outlineName}
        size={24}
        color={focused ? color : COLORS.inactive}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          marginTop: 2,
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: COLORS.inactive,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "แดชบอร์ด",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="home"
              outlineName="home-outline"
              color={COLORS.dashboard}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="record"
        options={{
          title: "บันทึก",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="calendar"
              outlineName="calendar-outline"
              color={COLORS.record}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "สแกน",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="camera"
              outlineName="camera-outline"
              color={COLORS.scan}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="plan"
        options={{
          title: "แผน",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="document-text"
              outlineName="document-text-outline"
              color={COLORS.plan}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "โปรไฟล์",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person"
              outlineName="person-outline"
              color={COLORS.profile}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 42,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});