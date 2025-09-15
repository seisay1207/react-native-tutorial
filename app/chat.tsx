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

import { ChatInput } from "@/components/ui/ChatInput";
import { ChatMessage } from "@/components/ui/ChatMessage";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  markMessageAsRead,
  sendMessage,
  subscribeToChatMessages,
} from "@/lib/firebase/chat";
import { ExtendedMessage } from "@/lib/firebase/models";
import { uploadDocument, uploadImage } from "@/lib/firebase/storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
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
  const { user, getChatRoomInfo } = useAuth();

  // URLパラメータからチャットルームIDを取得
  const params = useLocalSearchParams();
  const initialChatId = (params.chatId as string) || "general";

  // ローカル状態の管理
  const [messages, setMessages] = useState<ExtendedMessage[]>([]); // メッセージリスト
  const [isLoading, setIsLoading] = useState(false); // メッセージ送信のローディング状態
  const [isInitializing, setIsInitializing] = useState(true); // 初期化中の状態
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chatId, setChatId] = useState(initialChatId); // チャットルームID（動的）
  const [chatTitle, setChatTitle] = useState(""); // チャットルームタイトル

  // FlatListの参照（スクロール制御用）
  const flatListRef = useRef<FlatList>(null);

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
    const initializeChatRoom = async () => {
      if (!user) return;

      try {
        setIsInitializing(true);
        const roomInfo = await getChatRoomInfo(chatId);
        if (roomInfo) {
          setChatTitle(roomInfo.title);
        } else {
          setChatTitle("チャット"); // フォールバック
        }
      } catch (error) {
        console.error("Failed to initialize chat room:", error);
        setChatTitle("チャット"); // エラー時のフォールバック
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChatRoom();
  }, [chatId, user, getChatRoomInfo]);

  useEffect(() => {
    // （変更理由）：認証状態とローディング状態の両方を確認してからFirestoreクエリを実行
    if (!user || isLoading) {
      console.log(
        "ChatScreen: Skipping message subscription - user not authenticated or still loading"
      );
      return; // ユーザーが未認証またはローディング中の場合は何もしない
    }

    console.log(
      "ChatScreen: Setting up message subscription for chatId:",
      chatId,
      "user:",
      user.email
    );

    // Firestoreのリアルタイムリスナーを設定
    const unsubscribe = subscribeToChatMessages(chatId, (newMessages) => {
      console.log("ChatScreen: Received messages:", newMessages.length);
      setMessages(newMessages); // メッセージリストを更新
    });

    // クリーンアップ関数を返す
    return () => {
      console.log("ChatScreen: Cleaning up message subscription");
      unsubscribe();
    };
  }, [chatId, user, isLoading]); // chatId、user、またはisLoadingが変更された時に再実行

  /**
   * メッセージ送信処理
   *
   * 【処理フロー】
   * 1. 入力値の検証
   * 2. Firestoreにメッセージを保存
   * 3. 入力フィールドをクリア
   * 4. エラーハンドリング
   */
  const handleSendMessage = async (text: string) => {
    if (!user) return; // 未認証の場合は何もしない

    setIsLoading(true);
    console.log("Sending message:", text);

    try {
      // Firestoreにメッセージを保存
      await sendMessage(chatId, {
        chatId,
        text: text.trim(),
        sender: user.email || "unknown",
        type: "text",
      });

      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("エラー", "メッセージの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImage = async (uri: string) => {
    if (!user) return;

    setIsLoading(true);
    console.log("Sending image:", uri);

    try {
      // 画像をStorageにアップロード
      const imageUrl = await uploadImage(uri, chatId);

      // Firestoreにメッセージを保存
      await sendMessage(chatId, {
        chatId,
        text: "画像を送信しました",
        sender: user.email || "unknown",
        type: "image",
        metadata: {
          url: imageUrl,
          mimeType: "image/jpeg",
        },
      });

      console.log("Image sent successfully");
    } catch (error) {
      console.error("Failed to send image:", error);
      Alert.alert("エラー", "画像の送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFile = async (uri: string, fileName: string) => {
    if (!user) return;

    setIsLoading(true);
    console.log("Sending file:", fileName);

    try {
      // ファイルをStorageにアップロード
      const fileUrl = await uploadDocument(uri, chatId, fileName);

      // Firestoreにメッセージを保存
      await sendMessage(chatId, {
        chatId,
        text: `ファイル: ${fileName}`,
        sender: user.email || "unknown",
        type: "file",
        metadata: {
          url: fileUrl,
          fileName,
          mimeType: "application/octet-stream",
        },
      });

      console.log("File sent successfully");
    } catch (error) {
      console.error("Failed to send file:", error);
      Alert.alert("エラー", "ファイルの送信に失敗しました");
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
  const renderMessage = ({ item }: { item: ExtendedMessage }) => {
    const isOwnMessage = item.sender === user?.email; // 自分のメッセージかどうか

    // 自分のメッセージでない場合、表示時に既読にする
    if (!isOwnMessage && user && item.id) {
      markMessageAsRead(chatId, item.id, user.email || "unknown");
    }

    return <ChatMessage message={item} isOwnMessage={isOwnMessage} />;
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
  // 初期化中はローディング画面を表示
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {isInitializing ? "読み込み中..." : chatTitle}
            </Text>
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
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          onSendFile={handleSendFile}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: "#007bff",
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
