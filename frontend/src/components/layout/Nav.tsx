import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { useAuthStore } from '../../store/auth.store';

export function Nav() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <Link to="/" aria-label="WealthGift Home">
        <Logo />
      </Link>
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
