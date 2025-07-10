import { useState } from "react";
import { Button, Text, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [count, setCount] = useState(0);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button onPress={() => setCount(count + 1)} title="CountUp!" />
      <Text>{count}</Text>
    </View>
  );
}
