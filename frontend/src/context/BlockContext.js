'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const BlockContext = createContext();

export const BlockProvider = ({ children }) => {
  const [blockUpdates, setBlockUpdates] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState(new Set());

  const triggerBlockUpdate = useCallback(() => {
    setBlockUpdates(prev => prev + 1);
  }, []);

  const addBlockedUser = useCallback((userId) => {
    setBlockedUsers(prev => new Set([...prev, userId]));
    triggerBlockUpdate();
  }, [triggerBlockUpdate]);

  const removeBlockedUser = useCallback((userId) => {
    setBlockedUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    triggerBlockUpdate();
  }, [triggerBlockUpdate]);

  return (
    <BlockContext.Provider value={{ 
      blockUpdates, 
      blockedUsers,
      triggerBlockUpdate,
      addBlockedUser,
      removeBlockedUser,
      isUserBlocked: (userId) => blockedUsers.has(userId)
    }}>
      {children}
    </BlockContext.Provider>
  );
};

export const useBlock = () => {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
};