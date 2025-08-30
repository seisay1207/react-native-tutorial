/**
 * Avatar.tsx
 *
 * アバターコンポーネント
 *
 * 【役割】
 * - ユーザーやグループのアバター画像を表示
 * - 画像がない場合は、名前の頭文字を表示
 */

import { StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

export function Avatar({
  name,
  size = 40,
  backgroundColor = "#007AFF",
  textColor = "#FFFFFF",
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

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.4,
            color: textColor,
          },
        ]}
      >
        {getInitials(name)}
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
