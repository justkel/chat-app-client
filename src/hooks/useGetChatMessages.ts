import { useQuery, gql } from '@apollo/client';

const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($userId: ID!, $otherUserId: ID!) {
    getChatMessages(userId: $userId, otherUserId: $otherUserId) {
      id
      content
      timestamp
      sender {
        id
      }
      receiver {
        id
      }
    }
  }
`;

export const useGetChatMessages = (userId: string | null, otherUserId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_CHAT_MESSAGES, {
    variables: { userId, otherUserId },
    skip: !userId || !otherUserId,
  });

  return { data, loading, error, refetch };
};
