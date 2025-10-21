import { useMutation, gql } from '@apollo/client';

const UPDATE_READ_RECEIPTS = gql`
  mutation UpdateReadReceipts($userId: ID!, $readReceipts: Boolean!) {
    updateReadReceipts(userId: $userId, readReceipts: $readReceipts) {
      id
      fullName
      readReceipts
    }
  }
`;

export const useUpdateReadReceipts = () => {
  const [updateReadReceiptsMutation, { data, loading, error }] =
    useMutation(UPDATE_READ_RECEIPTS);

  const updateReadReceipts = async (userId: string, readReceipts: boolean) => {
    try {
      const response = await updateReadReceiptsMutation({
        variables: { userId, readReceipts },
      });

      return response.data.updateReadReceipts;
    } catch (err) {
      console.error('Error updating read receipts:', err);
      throw err;
    }
  };

  return { updateReadReceipts, data, loading, error };
};
