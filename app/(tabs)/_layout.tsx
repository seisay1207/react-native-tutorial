import { useAuth } from "@/app/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  const { user } = useAuth();

  // ユーザーがログインしていない場合は認証画面にリダイレクト
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "チャット",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chatbubble" color={color} />
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
      {name === "chatbubble" ? "💬" : "📱"}
    </Text>
  );
}
