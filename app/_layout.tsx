import { auth } from "@/app/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "column", gap: 10 }}>
        <Text>Email</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: "black" }}
          value={email}
          onChangeText={setEmail}
        />
        <Text>Password</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: "black" }}
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
