/**
 * ChatMessage.tsx
 *
 * チャットメッセージを表示するコンポーネント
 *
 * 【機能】
 * 1. メッセージの表示（テキスト、画像、ファイル）
 * 2. 送信者の情報表示
 * 3. タイムスタンプの表示
 * 4. 既読/未読ステータスの表示
 */

import { ExtendedMessage } from "@/lib/firebase/models";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "./Avatar";

interface ChatMessageProps {
  message: ExtendedMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export const ChatMessage = memo(
  ({ message, isOwnMessage, showAvatar = true }: ChatMessageProps) => {
    // メッセージの送信時刻をフォーマット
    const formattedTime = message.timestamp
      ? format(message.timestamp.toDate(), "HH:mm", {
          locale: ja,
        })
      : "";

    return (
      <View
        style={[
          styles.container,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {/* アバター（自分のメッセージ以外で表示） */}
        {!isOwnMessage && showAvatar && (
          <View style={styles.avatarContainer}>
            <Avatar userId={message.sender} size={32} />
          </View>
        )}

        <View
          style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {/* メッセージの種類に応じて表示を切り替え */}
          {message.type === "text" && (
            <Text style={styles.messageText}>{message.text}</Text>
          )}

          {message.type === "image" && message.metadata?.url && (
            <Image
              source={{ uri: message.metadata.url }}
              style={styles.messageImage}
              contentFit="cover"
            />
          )}

          {message.type === "file" && (
            <View style={styles.fileContainer}>
              <Text style={styles.fileName}>
                {message.metadata?.fileName || "ファイル"}
              </Text>
              {message.metadata?.fileSize && (
                <Text style={styles.fileSize}>
                  {formatFileSize(message.metadata.fileSize)}
                </Text>
              )}
            </View>
          )}

          {/* タイムスタンプと既読表示 */}
          <View style={styles.messageFooter}>
            {isOwnMessage && message.readBy && (
              <Text
                style={[
                  styles.readStatus,
                  isOwnMessage ? styles.ownReadStatus : styles.otherReadStatus,
                ]}
              >
                {message.readBy.length > 0
                  ? `既読 ${message.readBy.length}`
                  : "未読"}
              </Text>
            )}
            <Text
              style={[
                styles.timestamp,
                isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
              ]}
            >
              {formattedTime}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

// ファイルサイズを人間が読みやすい形式に変換
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageContent: {
    maxWidth: "70%",
    borderRadius: 16,
    padding: 12,
  },
  ownMessage: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#E9E9EB",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: "#000000",
  },
  messageImage: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: 8,
  },
  fileContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  fileSize: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  ownTimestamp: {
    color: "#FFFFFF",
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#666666",
  },
  readStatus: {
    fontSize: 12,
    marginRight: 8,
  },
  ownReadStatus: {
    color: "#FFFFFF",
  },
  otherReadStatus: {
    color: "#666666",
  },
});
