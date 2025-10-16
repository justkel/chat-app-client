import { useQuery, gql } from '@apollo/client';

const GET_BLOCKED_USERS = gql`
  query GetBlockedUsers($ownerId: ID!) {
    getBlockedUsers(ownerId: $ownerId) {
      id
      isOtherUserBlocked
      otherUser {
        id
        fullName
        email
        profilePicture
      }
    }
  }
`;

export const useGetBlockedUsers = (ownerId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_BLOCKED_USERS, {
    variables: { ownerId },
    skip: !ownerId,
    fetchPolicy: 'cache-and-network',
  });

  return { data, loading, error, refetch };
};
