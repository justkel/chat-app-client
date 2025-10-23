import { useQuery, gql } from '@apollo/client';

const GET_RECENT_CONVERSATIONS_LAST_MESSAGES = gql`
  query GetRecentConversationsLastMessages($userId: ID!) {
    getRecentConversationsLastMessages(userId: $userId) {
      id
      content
      timestamp
      sender { id firstName lastName profilePicture }
      receiver { id firstName lastName profilePicture }
    }
  }
`;

export const useGetRecentConversationsLastMessages = (userId: string | null) => {
  const { data, loading, error } = useQuery(GET_RECENT_CONVERSATIONS_LAST_MESSAGES, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};

const GET_UNREAD_SUMMARY = gql`
  query GetUnreadSummary($userId: Int!) {
    getUnreadSummary(userId: $userId) {
      totalUnreadMessages
      unreadConversationCount
    }
  }
`;

export const useGetUnreadSummary = (userId: number | null) => {
  const { data, loading, error } = useQuery(GET_UNREAD_SUMMARY, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};

const GET_PENDING_REQUEST_SUMMARY = gql`
  query GetPendingRequestSummary($userId: ID!) {
    getPendingRequestSummary(userId: $userId) {
      sentPendingCount
      receivedPendingCount
    }
  }
`;

export const useGetPendingRequestSummary = (userId: number | null) => {
  const { data, loading, error } = useQuery(GET_PENDING_REQUEST_SUMMARY, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};

const GET_BLOCKED_USERS_COUNT = gql`
  query GetBlockedUsersCount($ownerId: ID!) {
    getBlockedUsersCount(ownerId: $ownerId) {
      blockedCount
    }
  }
`;

export const useGetBlockedUsersCount = (ownerId: number | null) => {
  const { data, loading, error } = useQuery(GET_BLOCKED_USERS_COUNT, {
    variables: { ownerId },
    skip: !ownerId,
  });

  return { data, loading, error };
};

export const GET_MESSAGE_STATS = gql`
  query GetMessageStats($userId: ID!) {
    getMessageStats(userId: $userId) {
      totalMessagesSent
      totalMessagesReceived
    }
  }
`;

export const useGetMessageStats = (userId: number | null) => {
  const { data, loading, error } = useQuery(GET_MESSAGE_STATS, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};