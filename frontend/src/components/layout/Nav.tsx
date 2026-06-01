import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { useAuthStore } from '../../store/auth.store';

interface NavProps {
  /** When provided, shows a prominent back button that navigates to this path */
  backTo?: string;
  /** Label for the back button (default: "Back") */
  backLabel?: string;
}

export function Nav({ backTo, backLabel = 'Back' }: NavProps = {}) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left side: back button OR logo */}
      <div className="flex items-center gap-3">
        {backTo ? (
          <Link
            to={backTo}
            aria-label={backLabel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            {/* Arrow */}
            <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            <span className="text-sm font-semibold hidden sm:inline">{backLabel}</span>
          </Link>
        ) : (
          <Link to="/" aria-label="WealthGift Home">
            <Logo />
          </Link>
        )}

        {/* Show logo next to back button on sm+ */}
        {backTo && (
          <Link to="/" aria-label="WealthGift Home" className="hidden sm:block">
            <Logo />
          </Link>
        )}
      </div>

      {/* Right side: nav links + auth */}
      <div className="flex items-center gap-3 sm:gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
        <Link to="/" className="hover:text-gray-900 dark:hover:text-white hidden sm:inline">Home</Link>
        {user && <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white hidden sm:inline">Dashboard</Link>}
        {!user ? (
          <Link to="/login" className="bg-[#F5C518] text-black font-bold px-5 py-2 rounded-full hover:bg-yellow-400 transition-colors">Login</Link>
        ) : (
          <button onClick={handleLogout} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-5 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Logout</button>
        )}
      </div>
    </nav>
  );
}
