import { Home, MessageCircle, Calendar, User } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useDarkMode } from '../context/DarkModeContext';

/**
 * Bottom navigation bar
 * - pill shaped container with blur and shadow
 * - icon-only tabs with optional active label + gradient indicator
 * - safe area inset support
 */
export default function Navigation({ currentPage, setCurrentPage }) {
  const { darkMode } = useDarkMode();
  const shouldReduceMotion = useReducedMotion();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'chat', icon: MessageCircle, label: 'Chat', badge: 0 },
    { id: 'calendar', icon: Calendar, label: 'Calendar', badge: 0 },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const handleSelect = (id) => setCurrentPage(id);

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.2,
    ease: 'easeOut'
  };

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={transition}
      className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto mb-2 flex max-w-md items-center justify-between rounded-3xl shadow-lg ring-1 ring-black/5 backdrop-blur-xl"
        style={{
          backgroundColor: darkMode
            ? 'rgba(24,24,27,0.8)'
            : 'rgba(255,255,255,0.8)'
        }}
      >
        {tabs.map(({ id, icon: Icon, label, badge }) => {
          const active = currentPage === id;
          return (
            <motion.button
              key={id}
              onClick={(e) => {
                // Prevent the click from affecting underlying elements
                e.stopPropagation();
                handleSelect(id);
              }}
              whileTap={{ scale: 0.98, opacity: 0.8 }}
              className="relative flex h-12 flex-1 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 2}
                className={active ? '' : 'opacity-70'}
                style={{
                  color: active
                    ? 'var(--accent)'
                    : darkMode
                      ? 'rgb(156 163 175)'
                      : 'rgb(107 114 128)',
                  fill: active ? 'currentColor' : 'none'
                }}
              />

              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-1 h-1 w-8 rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg,var(--accent),var(--accent-2))'
                  }}
                  transition={transition}
                />
              )}

              {badge > 0 && (
                <span className="absolute top-2 right-4 min-w-[0.5rem] rounded-full bg-[var(--accent)] px-1 text-[10px] font-medium text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {badge === true && (
                <span className="absolute top-2 right-4 h-2 w-2 rounded-full bg-[var(--accent)]" />
              )}
              <span className="sr-only">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

Navigation.propTypes = {
  currentPage: PropTypes.string.isRequired,
  setCurrentPage: PropTypes.func.isRequired
};
