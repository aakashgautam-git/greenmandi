import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/dashboard' },
    { name: 'How It Works', path: '#' },
    { name: "Today's Change", path: '/todays-change' },
    { name: 'Blog', path: '#' },
  ];

  // Don't show navbar on the auth page
  if (location.pathname === '/auth') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="w-full bg-white h-20 px-8 flex items-center justify-between mx-auto shadow-sm sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 decoration-transparent">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
          <Sun className="w-4 h-4" />
        </div>
        <span className="font-Display font-bold text-xl text-[#1E293B]">
          Solarix
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <Link 
            key={link.name}
            to={link.path} 
            className={`text-sm font-medium transition-colors ${
              (location.pathname === link.path && link.path !== '#') ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <>
            {/* Role Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              user.role === 'seller'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'seller' ? 'bg-amber-500' : 'bg-sky-500'}`}></span>
              {user.role === 'seller' ? 'Seller' : 'Buyer'}
            </div>

            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* User Name */}
            <span className="text-sm font-semibold text-[#1E293B] hidden md:inline">
              {user.name}
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
