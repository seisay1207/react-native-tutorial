/**
 * Avatar.tsx
 *
 * アバターコンポーネント
 *
 * 【役割】
 * - ユーザーやグループのアバター画像を表示
 * - 画像がない場合は、名前の頭文字を表示
 */

import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function Avatar({
  name,
  uri,
  size = 40,
  backgroundColor = "#007AFF",
  textColor = "#FFFFFF",
  style,
}: AvatarProps) {
  // 名前から頭文字を取得
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor,
    },
    style,
  ];

  if (uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.4,
            color: textColor,
          },
        ]}
      >
        {name ? getInitials(name) : "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: "600",
  },
});
