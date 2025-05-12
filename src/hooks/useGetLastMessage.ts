import { useQuery, gql, useLazyQuery } from '@apollo/client';

const GET_LAST_MESSAGES = gql`
  query GetLastMessages($userId: ID!, $otherUserIds: [ID!]!) {
    getLastMessages(userId: $userId, otherUserIds: $otherUserIds) {
      id
      content
      timestamp
      sender {
        id
        fullName
      }
      receiver {
        id
        fullName
      }
      status
      senderDFM
      receiverDFM
      delForAll
      wasForwarded
      wasSentWhileCurrentlyBlocked
      deliveredThenBlocked
      fileOriginalName
      caption
    }
  }
`;


export const useGetLastMessages = (userId: number, otherUserIds: number[]) => {
  const { data, loading, error } = useQuery(GET_LAST_MESSAGES, {
    variables: { userId, otherUserIds },
    skip: !userId || otherUserIds.length === 0, // Skip query if userId or otherUserIds is not provided
  });

  return { data, loading, error };
};


const GET_LAST_VALID_MESSAGES = gql`
  query GetLastValidMessages($userId: ID!, $otherUserId: ID!) {
    getLastValidMessages(userId: $userId, otherUserId: $otherUserId) {
      senderLastMessage {
        id
        content
        sender {
          id
          username
        }
        receiver {
          id
          username
        }
        timestamp
        status
        senderDFM
        receiverDFM
        delForAll
      }
      receiverLastMessage {
        id
        content
        sender {
          id
          username
        }
        receiver {
          id
          username
        }
        timestamp
        status
        senderDFM
        receiverDFM
        delForAll
        wasForwarded
        wasSentWhileCurrentlyBlocked
        deliveredThenBlocked
        fileOriginalName
        caption
      }
    }
  }
`;

export const useFetchLastValidMessages = () => {
  return useLazyQuery(GET_LAST_VALID_MESSAGES, {
    fetchPolicy: 'network-only', // Always fetch fresh data
  });
};
