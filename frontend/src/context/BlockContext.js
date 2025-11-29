'use client';
// context/BlockContext.js
import { createContext, useContext, useState } from 'react';

const BlockContext = createContext();

export const BlockProvider = ({ children }) => {
  const [blockUpdates, setBlockUpdates] = useState(0);

  const triggerBlockUpdate = () => {
    setBlockUpdates(prev => prev + 1);
  };

  return (
    <BlockContext.Provider value={{ blockUpdates, triggerBlockUpdate }}>
      {children}
    </BlockContext.Provider>
  );
};

export const useBlock = () => useContext(BlockContext);