import { Text, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Hello, world!</Text>
    </View>
  );
}
