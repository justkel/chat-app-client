import { gql, useQuery } from '@apollo/client';

const GET_ALL_CHAT_REQUESTS_MADE_BY_USER = gql`
  query GetAllChatRequestsMadeByUser($userId: ID!) {
    getAllChatRequestsMadeByUser(userId: $userId) {
      id
      receiver {
        id
        fullName
        email
      }
      status
    }
  }
`;

export const useGetAllChatRequestsMadeByUser = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_ALL_CHAT_REQUESTS_MADE_BY_USER, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error, refetch };
};
