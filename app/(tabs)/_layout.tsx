import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="chat-list"
        options={{
          title: "チャットルーム",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
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
      {/* 他のファイルがタブとして表示されるのを防ぐ */}
      <Tabs.Screen
        name="auth"
        options={{
          href: null, // タブバーに表示しない
        }}
      />
      {/* (tabs)フォルダ自体がタブとして表示されるのを防ぐ */}
      <Tabs.Screen
        name="[...missing]"
        options={{
          href: null, // タブバーに表示しない
        }}
      />
      {/* (tabs)タブの表示を明示的に防ぐ */}
      <Tabs.Screen
        name="(tabs)"
        options={{
          href: null, // タブバーに表示しない
        }}
      />
    </Tabs>
  );
}

// 簡単なアイコンコンポーネント（実際のアイコンライブラリを使用することを推奨）
function TabBarIcon({ name, color }: { name: string; color: string }) {
  return (
    <Text style={{ color, fontSize: 20 }}>
      {name === "chatbubble" ? "💬" : name === "list" ? "📋" : "📱"}
    </Text>
  );
}
