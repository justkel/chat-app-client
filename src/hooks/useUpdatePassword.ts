import { useMutation, gql } from '@apollo/client';

const UPDATE_PASSWORD = gql`
  mutation UpdatePassword(
    $userId: ID!
    $currentPassword: String!
    $newPassword: String!
  ) {
    updatePassword(
      userId: $userId
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      id
      fullName
      email
    }
  }
`;

export const useUpdatePassword = () => {
  const [updatePasswordMutation, { data, loading, error }] = useMutation(UPDATE_PASSWORD);

  const updatePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      const response = await updatePasswordMutation({
        variables: { userId, currentPassword, newPassword },
      });

      return response.data.updatePassword;
    } catch (err) {
      console.error('Error updating password:', err);
      throw err;
    }
  };

  return { updatePassword, data, loading, error };
};
