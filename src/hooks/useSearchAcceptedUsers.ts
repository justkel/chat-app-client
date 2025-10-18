import { useQuery, gql } from '@apollo/client';

const SEARCH_ACCEPTED_USERS = gql`
  query SearchAcceptedUsers($userId: ID!, $searchTerm: String!) {
    searchAcceptedUsers(userId: $userId, searchTerm: $searchTerm) {
      id
      fullName
    }
  }
`;

export const useSearchAcceptedUsers = (
  userId: string | null,
  searchTerm: string
) => {
  const { data, loading, error, refetch } = useQuery(SEARCH_ACCEPTED_USERS, {
    variables: { userId, searchTerm },
    skip: !userId || searchTerm.length === 0,
  });

  return { data, loading, error, refetch };
};
