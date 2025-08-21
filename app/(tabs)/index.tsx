/**
 * (tabs)/index.tsx
 *
 * タブレイアウトのデフォルト画面
 * チャットルーム一覧にリダイレクト
 */

import { Redirect } from "expo-router";

export default function TabsIndex() {
  return <Redirect href="/(tabs)/chat-list" />;
}
