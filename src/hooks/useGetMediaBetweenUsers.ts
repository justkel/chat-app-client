import { useQuery, gql } from "@apollo/client";

const GET_MEDIA_BETWEEN_USERS = gql`
  query GetMediaBetweenUsers($userId: ID!, $otherUserId: ID!) {
    getMediaBetweenUsers(userId: $userId, otherUserId: $otherUserId) {
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
      deliveredAt
      wasForwarded
      isStarredByCurrentUser
      isStarredByOtherUser
      wasSentWhileCurrentlyBlocked
      deliveredThenBlocked
      fileOriginalName
      caption
    }
  }
`;

export const useGetMediaBetweenUsers = (
  userId: string | null,
  otherUserId: string | null
) => {
  const { data, loading, error, refetch } = useQuery(GET_MEDIA_BETWEEN_USERS, {
    variables: { userId, otherUserId },
    skip: !userId || !otherUserId,
  });

  return {
    data,
    loading,
    error,
    refetch,
  };
};
