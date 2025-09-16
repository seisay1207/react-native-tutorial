import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e1e5e9",
          backgroundColor: "#fff",
          height: Platform.select({
            ios: 88, // iOSではセーフエリアを考慮して高さを増やす
            android: 60,
          }),
          paddingBottom: Platform.select({
            ios: 28, // iOSのホームインジケータ分の余白
            android: 0,
          }),
        },
        tabBarItemStyle: {
          height: Platform.select({
            ios: 60,
            android: 60,
          }),
          margin: 0,
          padding: 0,
          paddingTop: Platform.select({
            ios: 8,
            android: 0,
          }),
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.select({
            ios: 4,
            android: 8,
          }),
        },
        tabBarActiveBackgroundColor: "rgba(0, 122, 255, 0.12)",
      }}
    >
      <Tabs.Screen
        name="friends"
        options={{
          title: "友達",
          tabBarIcon: ({ color }) => <TabBarIcon name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "チャット",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chatbubble" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "通知",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="notifications" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// 簡単なアイコンコンポーネント（実際のアイコンライブラリを使用することを推奨）
function TabBarIcon({ name, color }: { name: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 20 }}>
      {name === "chatbubble"
        ? "💬"
        : name === "people"
        ? "👥"
        : name === "notifications"
        ? "🔔"
        : "📱"}
    </Text>
  );
}
