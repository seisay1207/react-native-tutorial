/**
 * index.tsx (ChatScreen)
 *
 * チャット画面のメインコンポーネント
 *
 * 【学習ポイント】
 * 1. React Nativeの主要コンポーネント（FlatList, SafeAreaView, KeyboardAvoidingView）
 * 2. Firebase Firestoreとのリアルタイム連携
 * 3. プラットフォーム固有の処理（iOS/Android/Web）
 * 4. 状態管理とエラーハンドリング
 * 5. パフォーマンス最適化（useRef, useEffect）
 */

import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import {
  Message,
  addMessage,
  addMultipleMessages,
  getChatRooms,
  subscribeToMessages,
} from "@/lib/firebase/firestore";
import { ChatRoom } from "@/lib/firebase/models";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * ChatScreen コンポーネント
 *
 * 【役割】
 * - リアルタイムチャット機能の提供
 * - メッセージの送信・受信・表示
 * - ユーザー認証状態の管理
 * - プラットフォーム固有のUI処理
 */
export default function ChatScreen() {
  // 認証状態の取得
  const { user } = useAuth();

  // URLパラメータからチャットルームIDを取得
  const params = useLocalSearchParams();
  const initialChatId = (params.chatId as string) || "general";

  // ローカル状態の管理
  const [messages, setMessages] = useState<Message[]>([]); // メッセージリスト
  const [newMessage, setNewMessage] = useState(""); // 入力中のメッセージ
  const [isLoading, setIsLoading] = useState(false); // ローディング状態
  const [chatId, setChatId] = useState(initialChatId); // チャットルームID（動的）
  const [chatTitle, setChatTitle] = useState("一般チャット"); // チャットルームタイトル
  const [showChatSelector, setShowChatSelector] = useState(false); // チャットルーム選択モーダル
  const [availableChatRooms, setAvailableChatRooms] = useState<ChatRoom[]>([]); // 利用可能なチャットルーム

  // FlatListの参照（スクロール制御用）
  const flatListRef = useRef<FlatList>(null);

  /**
   * 安全な時間フォーマット関数
   *
   * FirestoreのTimestamp型を安全にDate型に変換してフォーマット
   */
  const formatMessageTime = (timestamp: any): string => {
    if (!timestamp) return "";

    try {
      // Timestamp型の場合はtoDate()を呼ぶ
      if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Date型の場合はそのまま使用
      if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // 文字列や数値の場合はDateに変換
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return "";
    } catch (error) {
      console.warn("Failed to format timestamp:", timestamp, error);
      return "";
    }
  };

  /**
   * メッセージのリアルタイム監視
   *
   * 【useEffectの役割】
   * - コンポーネントマウント時にFirestoreのリアルタイムリスナーを設定
   * - ユーザーが変更された時にリスナーを再設定
   * - アンマウント時にリスナーをクリーンアップ
   *
   * 【subscribeToMessages】
   * - FirestoreのonSnapshotをラップした関数
   * - 指定されたチャットルームのメッセージ変更をリアルタイム監視
   * - 新しいメッセージが追加されると自動的にUIが更新される
   */
  /**
   * チャットルーム情報の取得
   */
  useEffect(() => {
    if (!user) return;

    const fetchChatRoomInfo = async () => {
      try {
        // 利用可能なチャットルームを取得
        const rooms = await getChatRooms(user.uid);
        setAvailableChatRooms(rooms); // 利用可能なチャットルームを保存

        const currentRoom = rooms.find((room) => room.id === chatId);

        if (currentRoom) {
          if (currentRoom.type === "group" && currentRoom.name) {
            setChatTitle(currentRoom.name);
          } else {
            setChatTitle("個別チャット");
          }
        } else {
          // 既存のgeneralチャットの場合
          setChatTitle("一般チャット");
        }
      } catch (error) {
        console.error("Failed to fetch chat room info:", error);
      }
    };

    fetchChatRoomInfo();
  }, [chatId, user]);

  useEffect(() => {
    if (!user) return; // ユーザーが未認証の場合は何もしない

    console.log("Setting up message subscription for chatId:", chatId);

    // Firestoreのリアルタイムリスナーを設定
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      console.log("Received messages:", newMessages.length);
      setMessages(newMessages); // メッセージリストを更新
    });

    // クリーンアップ関数を返す
    return () => {
      console.log("Cleaning up message subscription");
      unsubscribe();
    };
  }, [chatId, user]); // chatIdまたはuserが変更された時に再実行

  /**
   * サンプルメッセージを追加する関数
   *
   * 【用途】
   * - チャット機能のテスト用
   * - 新規ユーザーへのガイド
   * - デモンストレーション
   */
  const addSampleMessages = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // サンプルメッセージの定義
      const sampleMessages = [
        {
          chatId,
          text: "こんにちは！チャットアプリへようこそ！",
          sender: "system@example.com",
        },
        {
          chatId,
          text: "このアプリでリアルタイムチャットを楽しんでください。",
          sender: "system@example.com",
        },
        {
          chatId,
          text: "メッセージを送信してみてください！",
          sender: "system@example.com",
        },
      ];

      // 複数メッセージを一括送信
      await addMultipleMessages(sampleMessages);
      Alert.alert("成功", "サンプルメッセージを追加しました");
    } catch (error) {
      console.error("Failed to add sample messages:", error);
      Alert.alert("エラー", "サンプルメッセージの追加に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * メッセージ送信処理
   *
   * 【処理フロー】
   * 1. 入力値の検証
   * 2. Firestoreにメッセージを保存
   * 3. 入力フィールドをクリア
   * 4. エラーハンドリング
   */
  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return; // 未認証または空メッセージの場合は何もしない

    setIsLoading(true);
    console.log("Sending message:", newMessage);

    try {
      // Firestoreにメッセージを保存
      await addMessage({
        chatId,
        text: newMessage.trim(),
        sender: user.email || "unknown",
      });

      setNewMessage(""); // 入力フィールドをクリア
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("エラー", "メッセージの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * メッセージアイテムのレンダリング関数
   *
   * 【FlatListのrenderItemプロパティで使用】
   * - 各メッセージの表示スタイルを決定
   * - 自分のメッセージと他の人のメッセージを区別
   * - システムメッセージの特別な表示
   *
   * 【メッセージの種類】
   * - 自分のメッセージ: 右側、青い背景
   * - 他の人のメッセージ: 左側、グレー背景
   * - システムメッセージ: 中央、薄いグレー背景
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender === user?.email; // 自分のメッセージかどうか
    const isSystemMessage = item.sender === "system@example.com"; // システムメッセージかどうか

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          isSystemMessage && styles.systemMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isSystemMessage && styles.systemBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              isSystemMessage && styles.systemMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              isSystemMessage && styles.systemMessageTime,
            ]}
          >
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
        {/* 他の人のメッセージとシステムメッセージ以外に送信者名を表示 */}
        {!isOwnMessage && !isSystemMessage && (
          <Text style={styles.senderName}>{item.sender}</Text>
        )}
      </View>
    );
  };

  /**
   * ログアウト処理
   *
   * 【プラットフォーム固有の処理】
   * - Web: window.confirmとalertを使用
   * - iOS/Android: Alert.alertを使用
   *
   * 【処理フロー】
   * 1. 確認ダイアログを表示
   * 2. ユーザーの確認を待つ
   * 3. Firebaseからログアウト
   * 4. 結果をユーザーに通知
   */
  const handleLogout = async () => {
    console.log("ChatScreen: Logout button pressed");

    // プラットフォーム固有の確認ダイアログ
    if (Platform.OS === "web") {
      // Webブラウザ用の確認ダイアログ
      console.log("ChatScreen: Using window.confirm for web");
      const confirmed = window.confirm("ログアウトしますか？");
      if (!confirmed) {
        console.log("ChatScreen: Logout cancelled");
        return;
      }

      console.log("ChatScreen: User confirmed logout (web)");
      const result = await signOutUser();
      console.log("ChatScreen: SignOut result:", result);

      if (result.success) {
        console.log("ChatScreen: Logout successful, user should be redirected");
        alert("ログアウトしました");
      } else {
        console.log("ChatScreen: Logout failed:", result.error);
        alert("ログアウトに失敗しました");
      }
    } else {
      // ネイティブアプリ用（iOS/Android）の確認ダイアログ
      console.log("ChatScreen: Using native Alert for", Platform.OS);

      Alert.alert("ログアウト", "ログアウトしますか？", [
        {
          text: "キャンセル",
          style: "cancel",
          onPress: () => {
            console.log("ChatScreen: Logout cancelled");
          },
        },
        {
          text: "ログアウト",
          style: "destructive",
          onPress: async () => {
            console.log("ChatScreen: User confirmed logout");
            const result = await signOutUser();
            console.log("ChatScreen: SignOut result:", result);

            if (result.success) {
              console.log(
                "ChatScreen: Logout successful, user should be redirected"
              );
              Alert.alert("成功", "ログアウトしました");
            } else {
              console.log("ChatScreen: Logout failed:", result.error);
              Alert.alert("エラー", "ログアウトに失敗しました");
            }
          },
        },
      ]);
    }
  };

  /**
   * コンポーネントのレンダリング
   *
   * 【レイアウト構造】
   * SafeAreaView → KeyboardAvoidingView → ヘッダー + FlatList + 入力エリア
   *
   * 【主要コンポーネント】
   * - SafeAreaView: ノッチやステータスバーを避ける
   * - KeyboardAvoidingView: キーボード表示時の自動調整
   * - FlatList: 効率的なメッセージリスト表示
   * - TextInput: メッセージ入力フィールド
   */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{chatTitle}</Text>
            <TouchableOpacity
              style={styles.changeChatButton}
              onPress={() => setShowChatSelector(true)}
            >
              <Text style={styles.changeChatButtonText}>変更</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.sampleButton}
              onPress={addSampleMessages}
              disabled={isLoading}
            >
              <Text style={styles.sampleButtonText}>サンプル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* メッセージリスト */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id || Math.random().toString()}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* メッセージ入力エリア */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="メッセージを入力..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            <Text
              style={[
                styles.sendButtonText,
                (!newMessage.trim() || isLoading) &&
                  styles.sendButtonTextDisabled,
              ]}
            >
              送信
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* チャットルーム選択モーダル */}
      <Modal
        visible={showChatSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>チャットルームを選択</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowChatSelector(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableChatRooms}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chatRoomOption,
                  item.id === chatId && styles.selectedChatRoom,
                ]}
                onPress={() => {
                  setChatId(item.id);
                  setChatTitle(
                    item.type === "group" && item.name
                      ? item.name
                      : "個別チャット"
                  );
                  // チャット選択後にモーダルを閉じる
                  setShowChatSelector(false);
                }}
              >
                <Text style={styles.chatRoomOptionTitle}>
                  {item.type === "group" && item.name
                    ? item.name
                    : "個別チャット"}
                </Text>
                <Text style={styles.chatRoomOptionSubtitle}>
                  {item.participants.length}人参加
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyChatRooms}>
                <Text style={styles.emptyChatRoomsText}>
                  利用可能なチャットルームがありません
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginRight: 12,
  },
  changeChatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#007AFF",
    borderRadius: 16,
  },
  changeChatButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  sampleButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  sampleButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // モーダル関連のスタイル
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#6c757d",
    borderRadius: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chatRoomOption: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e5e9",
  },
  selectedChatRoom: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  chatRoomOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  chatRoomOptionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  emptyChatRooms: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyChatRoomsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  platformInfo: {
    marginTop: 20,
    fontSize: 14,
    color: "#888",
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageListContent: {
    paddingBottom: 100, // 入力エリアの高さを考慮
  },
  messageContainer: {
    flexDirection: "column",
    marginBottom: 10,
    alignSelf: "flex-start", // 自分のメッセージは左寄せ
  },
  ownMessage: {
    alignSelf: "flex-end", // 自分のメッセージは右寄せ
  },
  otherMessage: {
    alignSelf: "flex-start", // 相手のメッセージは左寄せ
  },
  systemMessage: {
    alignSelf: "center", // システムメッセージは中央寄せ
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
  },
  ownBubble: {
    backgroundColor: "#007bff",
    borderBottomLeftRadius: 0,
  },
  otherBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomRightRadius: 0,
  },
  systemBubble: {
    backgroundColor: "#f0f0f0", // システムメッセージのバブルは薄いグレー
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  ownMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#333",
  },
  systemMessageText: {
    color: "#666", // システムメッセージのテキストは薄いグレー
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    alignSelf: "flex-end",
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.8)",
  },
  otherMessageTime: {
    color: "#999",
  },
  systemMessageTime: {
    color: "#999", // システムメッセージの時間は薄いグレー
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 150,
    textAlignVertical: "top",
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007bff",
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#999",
  },
});
