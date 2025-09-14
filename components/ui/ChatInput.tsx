/**
 * ChatInput.tsx
 *
 * チャットメッセージ入力フォームコンポーネント
 *
 * 【機能】
 * 1. メッセージの入力
 * 2. 画像/ファイルの添付
 * 3. 送信ボタン
 * 4. 入力中表示
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendImage?: (uri: string) => Promise<void>;
  onSendFile?: (uri: string, fileName: string) => Promise<void>;
  disabled?: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onSendImage,
  onSendFile,
  disabled = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // メッセージ送信処理
  const handleSend = useCallback(async () => {
    if (!message.trim() || disabled || isLoading) return;

    try {
      setIsLoading(true);
      await onSendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [message, disabled, isLoading, onSendMessage]);

  // 画像選択・送信処理
  const handleImagePick = useCallback(async () => {
    if (disabled || isLoading || !onSendImage) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsLoading(true);
        await onSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, onSendImage]);

  // ファイル選択・送信処理
  const handleFilePick = useCallback(async () => {
    if (disabled || isLoading || !onSendFile) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsLoading(true);
        // ファイル名を生成（実際のアプリでは適切なファイル名を取得する必要があります）
        const fileName = result.assets[0].uri.split("/").pop() || "file";
        await onSendFile(result.assets[0].uri, fileName);
      }
    } catch (error) {
      console.error("Error picking file:", error);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, onSendFile]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        {/* 添付ボタン */}
        {(onSendImage || onSendFile) && (
          <View style={styles.attachButtonContainer}>
            {onSendImage && (
              <Pressable
                onPress={handleImagePick}
                disabled={disabled || isLoading}
                style={({ pressed }) => [
                  styles.attachButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={disabled ? "#999" : "#007AFF"}
                />
              </Pressable>
            )}
            {onSendFile && (
              <Pressable
                onPress={handleFilePick}
                disabled={disabled || isLoading}
                style={({ pressed }) => [
                  styles.attachButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="document-outline"
                  size={24}
                  color={disabled ? "#999" : "#007AFF"}
                />
              </Pressable>
            )}
          </View>
        )}

        {/* メッセージ入力フィールド */}
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="メッセージを入力..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!disabled && !isLoading}
        />

        {/* 送信ボタン */}
        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || disabled || isLoading}
          style={({ pressed }) => [
            styles.sendButton,
            (!message.trim() || disabled) && styles.sendButtonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={24} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  attachButtonContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000000",
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
