import { Text, View } from "react-native";
import "react-native-reanimated";

const Greeting = (props: { name: string }) => {
  return <Text>Hello, {props.name}!</Text>;
};

export default function RootLayout() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Greeting name="John" />
      <Greeting name="Jane" />
      <Greeting name="Jim" />
    </View>
  );
}
