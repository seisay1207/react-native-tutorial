/**
 * storage.ts
 *
 * Firebase Storageを使用したファイル管理機能
 *
 * 【機能】
 * 1. 画像のアップロード
 * 2. ファイルのアップロード
 * 3. ファイルのダウンロードURL取得
 * 4. ファイルの削除
 */

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./config";

/**
 * ファイルをアップロードする
 *
 * @param file - アップロードするファイルのURI
 * @param path - 保存先のパス
 * @returns ダウンロードURL
 */
export const uploadFile = async (
  uri: string,
  path: string
): Promise<string> => {
  try {
    // URIからBlobを作成
    const response = await fetch(uri);
    const blob = await response.blob();

    // Storageの参照を作成
    const storageRef = ref(storage, path);

    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, blob);
    console.log("File uploaded successfully:", snapshot.metadata.fullPath);

    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("File download URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * 画像をアップロードする
 *
 * @param uri - 画像のURI
 * @param chatId - チャットルームID
 * @returns ダウンロードURL
 */
export const uploadImage = async (
  uri: string,
  chatId: string
): Promise<string> => {
  const timestamp = Date.now();
  const path = `chats/${chatId}/images/${timestamp}.jpg`;
  return uploadFile(uri, path);
};

/**
 * 一般ファイルをアップロードする
 *
 * @param uri - ファイルのURI
 * @param chatId - チャットルームID
 * @param fileName - ファイル名
 * @returns ダウンロードURL
 */
export const uploadDocument = async (
  uri: string,
  chatId: string,
  fileName: string
): Promise<string> => {
  const timestamp = Date.now();
  const path = `chats/${chatId}/files/${timestamp}_${fileName}`;
  return uploadFile(uri, path);
};
