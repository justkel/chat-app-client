// src/hooks/useGetAllUsersExcept.ts
import { gql, useQuery } from '@apollo/client';

const GET_ALL_USERS_EXCEPT = gql`
  query GetAllUsersExcept($id: ID!) {
    getAllUsersExcept(id: $id) {
      id
      email
      fullName
    }
  }
`;

export const useGetAllUsersExcept = (id: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_ALL_USERS_EXCEPT, {
    variables: { id },
    skip: !id, // Skip the query if id is null
  });

  return { data, loading, error, refetch };
};
