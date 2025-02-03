import { gql, useQuery } from '@apollo/client';

const GET_OTHER_USER_CHAT_DETAILS = gql`
  query GetOtherUserChatDetails($userId: ID!, $otherUserIds: [ID!]!) {
    getOtherUserChatDetails(userId: $userId, otherUserIds: $otherUserIds) {
      id
      customUsername
      otherUser {
        id
        fullName
        profilePicture
      }
    }
  }
`;

export const useGetChatUserDetails = (userId: number, otherUserIds: number[]) => {
  return useQuery(GET_OTHER_USER_CHAT_DETAILS, {
    variables: { userId, otherUserIds },
    skip: !userId || otherUserIds.length === 0,
    fetchPolicy: "network-only",
  });
};
