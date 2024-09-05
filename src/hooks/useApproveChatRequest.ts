import { useMutation, gql } from '@apollo/client';

const APPROVE_CHAT_REQUEST = gql`
  mutation ApproveChatRequest($requestId: ID!) {
    approveChatRequest(requestId: $requestId) {
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

export const useApproveChatRequest = () => {
  const [approveChatRequestMutation, { data, loading, error }] = useMutation(APPROVE_CHAT_REQUEST);

  const approveChatRequest = async (requestId: string) => {
    try {
      const response = await approveChatRequestMutation({
        variables: { requestId },
      });
      return response.data.approveChatRequest;
    } catch (err) {
      console.error('Error approving chat request:', err);
      throw err;
    }
  };

  return { approveChatRequest, data, loading, error };
};
