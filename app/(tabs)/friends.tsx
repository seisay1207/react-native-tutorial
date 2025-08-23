/**
 * friends.tsx
 *
 * 友達タブ - 開発中画面
 *
 * 【変更理由】：ファイル名を実態に合わせて変更
 *
 * 【学習ポイント】
 * 1. 開発中画面の実装パターン
 * 2. ユーザーフレンドリーなメッセージ表示
 * 3. 将来の機能拡張への準備
 */

import { SafeAreaView, StyleSheet, Text, View } from "react-native";

/**
 * FriendsScreen コンポーネント
 *
 * 【役割】
 * - 友達機能の開発中であることを表示
 * - 将来の友達一覧・管理機能の準備
 */
export default function FriendsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👥</Text>
        </View>
        <Text style={styles.title}>友達機能</Text>
        <Text style={styles.subtitle}>開発中です</Text>
        <Text style={styles.description}>
          友達の追加・管理機能は現在開発中です。{"\n"}
          しばらくお待ちください。
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureTitle}>実装予定の機能:</Text>
          <Text style={styles.featureItem}>• 友達検索・追加</Text>
          <Text style={styles.featureItem}>• 友達リスト管理</Text>
          <Text style={styles.featureItem}>• 友達とのチャット開始</Text>
          <Text style={styles.featureItem}>• オンライン状態表示</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    maxWidth: 280,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  featureItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 4,
  },
});
