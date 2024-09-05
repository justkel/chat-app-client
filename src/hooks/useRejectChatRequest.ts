import { useMutation, gql } from '@apollo/client';

const REJECT_CHAT_REQUEST = gql`
  mutation RejectChatRequest($requestId: ID!) {
    rejectChatRequest(requestId: $requestId) {
      id
      status
      requester {
        id
        fullName
      }
      receiver {
        id
        fullName
      }
    }
  }
`;

export const useRejectChatRequest = () => {
  const [rejectChatRequestMutation, { data, loading, error }] = useMutation(REJECT_CHAT_REQUEST);

  const rejectChatRequest = async (requestId: string) => {
    try {
      const response = await rejectChatRequestMutation({
        variables: { requestId },
      });
      return response.data.rejectChatRequest;
    } catch (err) {
      console.error('Error rejecting chat request:', err);
      throw err;
    }
  };

  return { rejectChatRequest, data, loading, error };
};
