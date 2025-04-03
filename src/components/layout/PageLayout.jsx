import React from 'react';

const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top safe area */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-gray-50 dark:bg-gray-950 z-[999]" />
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>

      {/* Bottom safe area */}
      <div className="fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-gray-50 dark:bg-gray-950 z-[49]" />
    </div>
  );
};

export default PageLayout; 