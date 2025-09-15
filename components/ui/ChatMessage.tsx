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
import Avatar from "./Avatar";

interface ChatMessageProps {
  message: ExtendedMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export const ChatMessage = memo(
  ({ message, isOwnMessage, showAvatar = true }: ChatMessageProps) => {
    // （変更理由）：timestampがundefinedの場合のエラーハンドリングを追加
    const formattedTime =
      message.timestamp && typeof message.timestamp.toDate === "function"
        ? format(message.timestamp.toDate(), "HH:mm", {
            locale: ja,
          })
        : "";

    return (
      <View style={styles.wrapper}>
        {/* 左側のメッセージ（相手） */}
        {!isOwnMessage && (
          <View style={styles.leftSide}>
            {showAvatar && (
              <View style={styles.avatarContainer}>
                <Avatar
                  name={message.senderDisplayName || message.sender}
                  size={32}
                  backgroundColor="#E9E9EB"
                  textColor="#666666"
                />
              </View>
            )}
            <View style={[styles.messageContent, styles.otherMessage]}>
              {/* メッセージの種類に応じて表示を切り替え */}
              {message.type === "text" && (
                <Text style={[styles.messageText, styles.otherMessageText]}>
                  {message.text}
                </Text>
              )}

              {message.type === "image" && message.metadata?.url && (
                <Image
                  source={{ uri: message.metadata.url }}
                  style={styles.messageImage}
                  contentFit="cover"
                />
              )}

              {message.type === "file" && (
                <View style={[styles.fileContainer, styles.otherFileContainer]}>
                  <Text style={[styles.fileName, styles.otherFileName]}>
                    {message.metadata?.fileName || "ファイル"}
                  </Text>
                  {message.metadata?.fileSize && (
                    <Text style={[styles.fileSize, styles.otherFileSize]}>
                      {formatFileSize(message.metadata.fileSize)}
                    </Text>
                  )}
                </View>
              )}

              {/* タイムスタンプと既読表示 */}
              <View style={styles.messageFooter}>
                <Text style={[styles.timestamp, styles.otherTimestamp]}>
                  {formattedTime}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 右側のメッセージ（自分） */}
        {isOwnMessage && (
          <View style={styles.rightSide}>
            <View style={[styles.messageContent, styles.ownMessage]}>
              {/* メッセージの種類に応じて表示を切り替え */}
              {message.type === "text" && (
                <Text style={[styles.messageText, styles.ownMessageText]}>
                  {message.text}
                </Text>
              )}

              {message.type === "image" && message.metadata?.url && (
                <Image
                  source={{ uri: message.metadata.url }}
                  style={styles.messageImage}
                  contentFit="cover"
                />
              )}

              {message.type === "file" && (
                <View style={[styles.fileContainer, styles.ownFileContainer]}>
                  <Text style={[styles.fileName, styles.ownFileName]}>
                    {message.metadata?.fileName || "ファイル"}
                  </Text>
                  {message.metadata?.fileSize && (
                    <Text style={[styles.fileSize, styles.ownFileSize]}>
                      {formatFileSize(message.metadata.fileSize)}
                    </Text>
                  )}
                </View>
              )}

              {/* タイムスタンプと既読表示 */}
              <View style={styles.messageFooter}>
                {message.readBy && (
                  <Text style={[styles.readStatus, styles.ownReadStatus]}>
                    {message.readBy.length > 0
                      ? `既読 ${message.readBy.length}`
                      : "未読"}
                  </Text>
                )}
                <Text style={[styles.timestamp, styles.ownTimestamp]}>
                  {formattedTime}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  wrapper: {
    width: "100%",
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  leftSide: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    width: "100%",
  },
  rightSide: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    width: "100%",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageContent: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  ownMessageText: {
    color: "#FFFFFF", // 自分のメッセージは白文字
  },
  otherMessageText: {
    color: "#000000", // 相手のメッセージは黒文字
  },
  messageImage: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: 8,
  },
  fileContainer: {
    borderRadius: 8,
    padding: 8,
  },
  ownFileContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // 自分のメッセージ内のファイルコンテナ
  },
  otherFileContainer: {
    backgroundColor: "#FFFFFF", // 相手のメッセージ内のファイルコンテナ
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  ownFileName: {
    color: "#FFFFFF",
  },
  otherFileName: {
    color: "#000000",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 4,
  },
  ownFileSize: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  otherFileSize: {
    color: "#666666",
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
