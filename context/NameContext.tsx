import React, { createContext, useContext, useState } from 'react';

const NameContext = createContext({
  firstName: '',
  lastName: '',
  setFirstName: (v: string) => {},
  setLastName: (v: string) => {},
});

export const NameProvider = ({ children }: { children: React.ReactNode }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  return (
    <NameContext.Provider value={{ firstName, lastName, setFirstName, setLastName }}>
      {children}
    </NameContext.Provider>
  );
};

export const useName = () => useContext(NameContext); 
