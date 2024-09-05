import { gql, useMutation } from '@apollo/client';


const SEND_CHAT_REQUEST = gql`
  mutation SendChatRequest($requesterId: ID!, $receiverId: Float!) {
    sendChatRequest(requesterId: $requesterId, input: { receiverId: $receiverId }) {
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

export const useSendChatRequest = () => {
  const [sendChatRequestMutation, { data, loading, error }] = useMutation(SEND_CHAT_REQUEST);

  const sendChatRequest = async (requesterId: string, receiverId: string) => {
    try {
      const response = await sendChatRequestMutation({
        variables: { requesterId, receiverId },
      });
      return response.data.sendChatRequest;
    } catch (err) {
      console.error('Error sending chat request:', err);
      throw err;
    }
  };

  return { sendChatRequest, data, loading, error };
};
