import React, { createContext, useContext, useState } from 'react';

const MainAppContext = createContext();

export const MainAppProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <MainAppContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </MainAppContext.Provider>
  );
};

export const useMainApp = () => {
  const context = useContext(MainAppContext);
  if (!context) {
    throw new Error('useMainApp must be used within a MainAppProvider');
  }
  return context;
}; 