import { useQuery, gql, useMutation } from '@apollo/client';

const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($userId: ID!, $otherUserId: ID!) {
    getChatMessages(userId: $userId, otherUserId: $otherUserId) {
      id
      content
      timestamp
      sender {
        id
      }
      receiver {
        id
      }
      status
      senderDFM
      receiverDFM
      delForAll
    }
  }
`;

export const useGetChatMessages = (userId: string | null, otherUserId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_CHAT_MESSAGES, {
    variables: { userId, otherUserId },
    skip: !userId || !otherUserId,
  });

  return { data, loading, error, refetch };
};

const IS_USER_ONLINE = gql`
  query IsUserOnline($userId: ID!) {
    isUserOnline(userId: $userId)
  }
`;

const UPDATE_MESSAGE_STATUS = gql`
  mutation UpdateMessageStatus($messageId: ID!, $status: MessageStatus!) {
    updateMessageStatus(messageId: $messageId, status: $status) {
      id
      status
    }
  }
`;

export const useCheckUserOnline = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(IS_USER_ONLINE, {
    variables: { userId },
    skip: !userId,
  });

  return { data, loading, error, refetch };
};


export const useUpdateMessageStatus = () => {
  const [updateMessageStatusMutation, { data, loading, error }] = useMutation(UPDATE_MESSAGE_STATUS);

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await updateMessageStatusMutation({
        variables: { messageId, status },
      });
      return response.data.updateMessageStatus;
    } catch (err) {
      console.error('Error updating message status:', err);
      throw err;
    }
  };

  return { updateMessageStatus, data, loading, error };
};