import React, { createContext, useContext, useState } from 'react';

const AvatarContext = createContext({
  avatarUri: '',
  setAvatarUri: (uri: string) => {},
});

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [avatarUri, setAvatarUri] = useState('');
  return (
    <AvatarContext.Provider value={{ avatarUri, setAvatarUri }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => useContext(AvatarContext); 
