import { gql, useQuery } from '@apollo/client';

const GET_OTHER_USER_DETAILS = gql`
  query GetOtherUserDetails($userId: ID!, $otherUserId: ID!) {
    getOtherUserDetails(userId: $userId, otherUserId: $otherUserId) {
      id
      profilePicture
      username
      phoneNumber
    }
  }
`;

const GET_CHAT_SETTINGS = gql`
  query GetChatSettings($ownerId: ID!, $otherUserId: ID!) {
    getChatSettings(ownerId: $ownerId, otherUserId: $otherUserId) {
      customUsername
    }
  }
`;

export const useChatSettings = (ownerId: string, otherUserId: string) => {
  const { data, loading, error } = useQuery(GET_CHAT_SETTINGS, {
    variables: { ownerId, otherUserId },
  });

  return { data: data?.getChatSettings, loading, error };
};

export const useOtherUserDetails = (userId: string, otherUserId: string) => {
  const { data, loading, error } = useQuery(GET_OTHER_USER_DETAILS, {
    variables: { userId, otherUserId },
  });

  return { data: data?.getOtherUserDetails, loading, error };
};
