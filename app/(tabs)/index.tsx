import { useAuth } from "@/lib/contexts/AuthContext";
import { signOutUser } from "@/lib/firebase/auth";
import {
  Message,
  addMessage,
  addMultipleMessages,
  subscribeToMessages,
} from "@/lib/firebase/firestore";
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

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId] = useState("general"); // 簡単のため固定のチャットID
  const flatListRef = useRef<FlatList>(null);

  // メッセージのリアルタイム監視
  useEffect(() => {
    if (!user) return;

    console.log("Setting up message subscription for chatId:", chatId);
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      console.log("Received messages:", newMessages.length);
      setMessages(newMessages);
    });

    return () => {
      console.log("Cleaning up message subscription");
      unsubscribe();
    };
  }, [chatId, user]);

  // サンプルメッセージを追加
  const addSampleMessages = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
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

      await addMultipleMessages(sampleMessages);
      Alert.alert("成功", "サンプルメッセージを追加しました");
    } catch (error) {
      console.error("Failed to add sample messages:", error);
      Alert.alert("エラー", "サンプルメッセージの追加に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setIsLoading(true);
    console.log("Sending message:", newMessage);

    try {
      await addMessage({
        chatId,
        text: newMessage.trim(),
        sender: user.email || "unknown",
      });

      setNewMessage("");
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("エラー", "メッセージの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // メッセージアイテムのレンダリング
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender === user?.email;
    const isSystemMessage = item.sender === "system@example.com";

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
            {item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
        {!isOwnMessage && !isSystemMessage && (
          <Text style={styles.senderName}>{item.sender}</Text>
        )}
      </View>
    );
  };

  const handleLogout = async () => {
    console.log("ChatScreen: Logout button pressed");

    // プラットフォーム固有の確認ダイアログ
    if (Platform.OS === "web") {
      // Webブラウザ用
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
      // ネイティブアプリ用（iOS/Android）
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>チャット</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
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
