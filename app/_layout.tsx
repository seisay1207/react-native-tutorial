import { Text, View } from "react-native";

export default function RootLayout() {
  console.log("RootLayout: Minimal component");
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>ログイン画面</Text>
    </View>
  );
}
