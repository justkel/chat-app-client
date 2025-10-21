import { gql, useQuery } from '@apollo/client';

const GET_OTHER_USER_BY_ID = gql`
  query GetOtherUserById($id: ID!) {
    getOtherUserById(id: $id) {
      id
      fullName
      email
      username
      profilePicture
      isOnline
      readReceipts
    }
  }
`;

const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    getUserById(id: $id) {
      id
      fullName
      firstName
      lastName
      email
      username
      profilePicture
      isOnline
      readReceipts
      defaultChatWallpaper
    }
  }
`;

export const useGetOtherUserById = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_OTHER_USER_BY_ID, {
    variables: { id: userId },
    skip: !userId, // Skip the query if userId is null
  });

  return { data, loading, error, refetch };
};

export const useGetUserById = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id: userId },
    skip: !userId,
  });

  return { data, loading, error, refetch };
};
