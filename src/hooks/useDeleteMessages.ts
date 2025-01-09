import { gql, useMutation } from '@apollo/client';

export const DELETE_MESSAGES_MUTATION = gql`
  mutation deleteMessagesForUser($messageIds: [ID!]!, $userId: ID!) {
    deleteMessagesForUser(messageIds: $messageIds, userId: $userId)
  }
`;

export const useDeleteMessages = () => {
  const [deleteMessagesForUser, { data, loading, error }] = useMutation(DELETE_MESSAGES_MUTATION);

  const deleteMessages = (messageIds: string[], userId: string) => {
    deleteMessagesForUser({
      variables: { messageIds, userId }
    });
  };

  return {
    deleteMessages,
    data,
    loading,
    error
  };
};
