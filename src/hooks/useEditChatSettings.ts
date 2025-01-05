import { gql, useMutation } from '@apollo/client';

export const EDIT_CHAT_SETTINGS = gql`
  mutation EditChatSettings($ownerId: ID!, $otherUserId: ID!, $editInput: EditChatSettingsInput!) {
    editChatSettings(ownerId: $ownerId, otherUserId: $otherUserId, editInput: $editInput) {
      id
      customUsername
      customWallpaper
    }
  }
`;

export const useEditChatSettings = () => {
  const [editChatSettings, { data, loading, error }] = useMutation(EDIT_CHAT_SETTINGS);

  return {
    editChatSettings,
    data,
    loading,
    error,
  };
};
