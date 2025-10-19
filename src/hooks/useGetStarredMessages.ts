import { useQuery, gql } from '@apollo/client';

const GET_STARRED_MESSAGES = gql`
  query GetStarredMessages($userId: ID!) {
    getStarredMessages(userId: $userId) {
      id
      content
      timestamp
      sender {
        id
        fullName
        profilePicture
      }
      receiver {
        id
        fullName
        profilePicture
      }
      repliedTo {
        id
        content
        fileOriginalName
      }
      status
      isStarredByCurrentUser
      isStarredByOtherUser
      senderDFM
      receiverDFM
      delForAll
      deliveredAt
      wasForwarded
      wasSentWhileCurrentlyBlocked
      deliveredThenBlocked
      fileOriginalName
      caption
    }
  }
`;

export const useGetStarredMessages = (userId: string | null) => {
  const { data, loading, error, refetch } = useQuery(GET_STARRED_MESSAGES, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  return { data, loading, error, refetch };
};
