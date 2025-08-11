import { useEffect } from 'react';
import PropTypes from 'prop-types';

const PageLayout = ({ children }) => {
  useEffect(() => {
    const setVh = () => {
      const viewport = window.visualViewport;
      const vh = viewport ? viewport.height * 0.01 : window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.visualViewport?.addEventListener('resize', setVh);
    window.visualViewport?.addEventListener('scroll', setVh);
    window.addEventListener('resize', setVh);
    return () => {
      window.visualViewport?.removeEventListener('resize', setVh);
      window.visualViewport?.removeEventListener('scroll', setVh);
      window.removeEventListener('resize', setVh);
    };
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(var(--vh,1vh)*100)]">
      {/* Top safe area */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-gray-50 dark:bg-gray-950 z-[999] pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>

      {/* Bottom safe area */}
      <div className="fixed bottom-0 left-0 right-0 h-[env(safe-area-inset-bottom)] bg-gray-50 dark:bg-gray-950 z-[49] pointer-events-none" />
    </div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node
};

export default PageLayout;