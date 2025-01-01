import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';

const GET_UNREAD_MESSAGES_COUNT = gql`
  query GetUnreadMessagesCount($userId: ID!) {
    getUnreadMessagesCount(userId: $userId) {
      userId
      unreadCount  
    }
  }
`;

export const useGetUnreadMessagesCount = (userId: string | null) => {
  const { data, loading, error } = useQuery(GET_UNREAD_MESSAGES_COUNT, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};
