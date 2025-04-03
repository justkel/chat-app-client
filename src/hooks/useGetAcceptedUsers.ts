import { useQuery, gql } from '@apollo/client';

const GET_ACCEPTED_CHAT_USERS = gql`
  query GetAcceptedChatUsers($userId: ID!) {
    getAcceptedChatUsers(userId: $userId) {
      id
      fullName
      email
      profilePicture
    }
  }
`;

export const useGetAcceptedChatUsers = (userId: string | null) => {
  const { data, loading, error } = useQuery(GET_ACCEPTED_CHAT_USERS, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};

const GET_USERS_TO_FORWARD_TO = gql`
  query GetUsersToForwardTo($userId: ID!) {
    getUsersToForwardTo(userId: $userId) {
      id
      fullName
      email
      profilePicture
    }
  }
`;

export const useGetUsersToForwardTo = (userId: string | null) => {
  const { data, loading, error } = useQuery(GET_USERS_TO_FORWARD_TO, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error };
};

