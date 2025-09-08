/**
 * Button.tsx
 *
 * 再利用可能なButtonコンポーネント
 *
 * 【学習ポイント】
 * 1. React Nativeコンポーネントの設計
 * 2. TypeScriptでのProps型定義
 * 3. 条件付きスタイリング
 * 4. カスタムフック的なコンポーネント設計
 * 5. アクセシビリティの考慮
 */

import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

/**
 * ButtonPropsの型定義
 *
 * 【設計思想】
 * - TouchableOpacityPropsを継承してReact Nativeの標準プロパティを利用
 * - バリエーションとサイズの選択肢を提供
 * - 型安全性を確保
 * - 柔軟なコンテンツ表示をサポート
 *
 * 【プロパティ説明】
 * - title: ボタンに表示するテキスト（オプション）
 * - children: ボタンのコンテンツ（オプション、titleと排他的）
 * - variant: ボタンの種類（primary: メイン, secondary: サブ, danger: 危険）
 * - size: ボタンのサイズ（small, medium, large）
 * - textStyle: テキストのカスタムスタイル（オプション）
 */
interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Buttonコンポーネント
 *
 * 【役割】
 * - 統一感のあるボタンデザインを提供
 * - 複数のバリエーションとサイズをサポート
 * - 無効状態の適切な表示
 * - カスタムスタイルの拡張性
 *
 * 【使用例】
 * <Button title="ログイン" variant="primary" size="large" onPress={handleLogin} />
 * <Button title="キャンセル" variant="secondary" disabled={isLoading} />
 */
export default function Button({
  title,
  children,
  variant = "primary",
  size = "medium",
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const content = title || children;

  return (
    <TouchableOpacity
      style={[
        styles.button, // 基本スタイル
        styles[variant], // バリエーション固有のスタイル
        styles[size], // サイズ固有のスタイル
        disabled && styles.disabled, // 無効状態のスタイル
        style, // カスタムスタイルの適用
      ]}
      disabled={disabled}
      {...props} // その他のTouchableOpacityプロパティを継承
    >
      {typeof content === "string" ? (
        <Text
          style={[
            styles.text, // 基本テキストスタイル
            styles[`${variant}Text`], // バリエーション固有のテキストスタイル
            styles[`${size}Text`], // サイズ固有のテキストスタイル
            disabled && styles.disabledText, // 無効状態のテキストスタイル
            textStyle, // カスタムテキストスタイル
          ]}
        >
          {content}
        </Text>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#007AFF",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  danger: {
    backgroundColor: "#FF3B30",
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  disabled: {
    backgroundColor: "#ccc",
    borderColor: "#ccc",
  },
  text: {
    fontWeight: "600",
  },
  primaryText: {
    color: "white",
  },
  secondaryText: {
    color: "#007AFF",
  },
  dangerText: {
    color: "white",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: "#999",
  },
});
