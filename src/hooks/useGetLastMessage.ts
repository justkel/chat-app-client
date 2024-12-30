import { useQuery, gql } from '@apollo/client';

const GET_LAST_MESSAGES = gql`
  query GetLastMessages($userId: ID!, $otherUserIds: [ID!]!) {
    getLastMessages(userId: $userId, otherUserIds: $otherUserIds) {
      id
      content
      timestamp
      sender {
        id
        fullName
      }
      receiver {
        id
        fullName
      }
    }
  }
`;


export const useGetLastMessages = (userId: number, otherUserIds: number[]) => {
  const { data, loading, error } = useQuery(GET_LAST_MESSAGES, {
    variables: { userId, otherUserIds },
    skip: !userId || otherUserIds.length === 0, // Skip query if userId or otherUserIds is not provided
  });

  return { data, loading, error };
};
