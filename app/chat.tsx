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
import {
  Message,
  addMessage,
  getChatRooms,
  subscribeToMessages,
} from "@/lib/firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
        const rooms = await getChatRooms(user.uid);
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
  changeChatButton: {},
  changeChatButtonText: {},
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
