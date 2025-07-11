import { useState } from "react";
import { Button, Text, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [count, setCount] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);

  const setHistoryWithLimit = (value: string) => {
    const newHistory = [...history, value];
    if (newHistory.length > 5) {
      newHistory.shift();
    }
    setHistory(newHistory);
  };

  const hancleCountUp = () => {
    setCount(count + 1);
    setHistoryWithLimit("CountUp!");
  };

  const handleCountDown = () => {
    setCount(count - 1);
    setHistoryWithLimit("CountDown!");
  };

  const handleReset = () => {
    setCount(0);
    setHistoryWithLimit("Reset!");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>{count}</Text>
      <Button onPress={hancleCountUp} title="CountUp!" />
      <Button onPress={handleCountDown} title="CountDown!" />
      <Button onPress={handleReset} title="Reset!" />
      <Text>{history.join("\n")}</Text>
    </View>
  );
}
