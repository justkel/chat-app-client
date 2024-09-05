import { useQuery, gql } from '@apollo/client';

const FETCH_CHAT_REQUESTS = gql`
  query GetChatRequests($userId: ID!) {
    getChatRequests(userId: $userId) {
      id
      requester {
        fullName
      }
    }
  }
`;

export const useFetchChatRequests = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(FETCH_CHAT_REQUESTS, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error, refetch };
};
