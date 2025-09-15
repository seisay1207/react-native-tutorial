/**
 * useFriends.ts
 *
 * 友達機能に関するカスタムフック
 *
 * 【機能】
 * - 友達リストの取得
 * - 友達リクエストの送信
 * - 友達リクエストの承認/拒否
 * - 受信した友達リクエストの取得
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/contexts/AuthContext";
import {
  acceptFriendRequest,
  getFriends,
  getReceivedFriendRequests,
  getReceivedFriendRequestsWithSenderInfo,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../lib/firebase/firestore";
import { FriendRequest, UserProfile } from "../lib/firebase/models";

// 【変更理由】：送信者情報を含む友達リクエストの型定義を追加
type FriendRequestWithSender = FriendRequest & {
  senderProfile: UserProfile | null;
};

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [receivedRequestsWithSender, setReceivedRequestsWithSender] = useState<
    FriendRequestWithSender[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 友達リストを取得
  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const friendsList = await getFriends(user.uid);
      setFriends(friendsList);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "友達リストの取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 受信した友達リクエストを取得
  const loadReceivedRequests = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await getReceivedFriendRequests(user.uid);
      setReceivedRequests(requests);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "友達リクエストの取得に失敗しました"
      );
    }
  }, [user]);

  // 【変更理由】：送信者情報を含む受信した友達リクエストを取得
  const loadReceivedRequestsWithSender = useCallback(async () => {
    if (!user) return;
    try {
      const requests = await getReceivedFriendRequestsWithSenderInfo(user.uid);
      setReceivedRequestsWithSender(requests);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "受信した友達リクエストの取得に失敗しました"
      );
    }
  }, [user]);

  // 友達リクエストを送信
  const sendRequest = useCallback(
    async (toUserId: string, message?: string) => {
      if (!user) throw new Error("ユーザーがログインしていません");
      try {
        await sendFriendRequest(user.uid, toUserId, message);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "友達リクエストの送信に失敗しました"
        );
        throw err;
      }
    },
    [user]
  );

  // 友達リクエストを承認
  const acceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await acceptFriendRequest(requestId);
        // 【変更理由】：送信者情報付きのリクエストリストも更新
        await Promise.all([
          loadFriends(),
          loadReceivedRequests(),
          loadReceivedRequestsWithSender(),
        ]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "友達リクエストの承認に失敗しました"
        );
        throw err;
      }
    },
    [loadFriends, loadReceivedRequests, loadReceivedRequestsWithSender]
  );

  // 友達リクエストを拒否
  const rejectRequest = useCallback(
    async (requestId: string) => {
      try {
        await rejectFriendRequest(requestId);
        // 【変更理由】：送信者情報付きのリクエストリストも更新
        await Promise.all([
          loadReceivedRequests(),
          loadReceivedRequestsWithSender(),
        ]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "友達リクエストの拒否に失敗しました"
        );
        throw err;
      }
    },
    [loadReceivedRequests, loadReceivedRequestsWithSender]
  );

  // 初期データの読み込み
  useEffect(() => {
    if (user) {
      loadFriends();
      loadReceivedRequests();
      loadReceivedRequestsWithSender();
    }
  }, [user, loadFriends, loadReceivedRequests, loadReceivedRequestsWithSender]);

  // 友達を削除
  const removeFriendship = useCallback(
    async (friendId: string) => {
      if (!user) throw new Error("ユーザーがログインしていません");
      try {
        await removeFriend(user.uid, friendId);
        await loadFriends();
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "友達の削除に失敗しました"
        );
        throw err;
      }
    },
    [user, loadFriends]
  );

  return {
    friends,
    receivedRequests,
    receivedRequestsWithSender,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriendship,
    refresh: useCallback(async () => {
      await Promise.all([
        loadFriends(),
        loadReceivedRequests(),
        loadReceivedRequestsWithSender(),
      ]);
    }, [loadFriends, loadReceivedRequests, loadReceivedRequestsWithSender]),
  };
};
