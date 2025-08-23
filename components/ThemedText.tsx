/**
 * ThemedText.tsx
 *
 * テーマに対応したTextコンポーネント
 *
 * 【学習ポイント】
 * 1. React Nativeのテーマシステム実装
 * 2. ライト/ダークモードの対応
 * 3. 再利用可能なコンポーネント設計
 * 4. TypeScriptでの型拡張
 * 5. カスタムフックの活用
 */

import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * ThemedTextPropsの型定義
 *
 * 【設計思想】
 * - React NativeのTextPropsを継承
 * - ライト/ダークモード対応のカラー設定
 * - 定義済みテキストタイプの提供
 *
 * 【プロパティ説明】
 * - lightColor: ライトモード時のテキストカラー
 * - darkColor: ダークモード時のテキストカラー
 * - type: 事前定義されたテキストスタイル
 */
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

/**
 * ThemedTextコンポーネント
 *
 * 【役割】
 * - テーマに応じたテキストカラーの自動適用
 * - 事前定義されたテキストスタイルの提供
 * - ライト/ダークモードの自動切り替え
 *
 * 【使用例】
 * <ThemedText type="title">タイトル</ThemedText>
 * <ThemedText type="link" lightColor="#0066CC" darkColor="#66B3FF">リンク</ThemedText>
 *
 * 【テーマ管理】
 * - useThemeColorフックでテーマカラーを取得
 * - システムのダークモード設定に自動対応
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  // テーマに応じたカラーを取得
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color }, // テーマカラーの適用
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style, // カスタムスタイルの適用
      ]}
      {...rest} // その他のTextプロパティを継承
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
