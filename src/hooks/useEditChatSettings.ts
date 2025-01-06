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

export const SET_CUSTOM_WALLPAPER = gql`
  mutation SetCustomWallpaper($ownerId: ID!, $otherUserId: ID!, $wallpaper: String!) {
    setCustomWallpaper(ownerId: $ownerId, otherUserId: $otherUserId, wallpaper: $wallpaper) {
      customWallpaper
    }
  }
`;

export const useEditWallpaper = () => {
  const [setCustomWallpaper, { data, loading, error }] = useMutation(SET_CUSTOM_WALLPAPER);

  const updateWallpaper = (ownerId: string, otherUserId: string, wallpaper: string) => {
    setCustomWallpaper({
      variables: { ownerId, otherUserId, wallpaper }
    });
  };

  return {
    updateWallpaper,
    data,
    loading,
    error
  };
};
