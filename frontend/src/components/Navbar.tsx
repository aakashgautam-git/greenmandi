import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/dashboard' },
    { name: 'How It Works', path: '#' },
    { name: 'About Us', path: '#' },
    { name: 'Blog', path: '#' },
  ];

  return (
    <nav className="w-full bg-white h-20 px-8 flex items-center justify-between mx-auto shadow-sm sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 decoration-transparent">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
          <Leaf className="w-4 h-4" />
        </div>
        <span className="font-Display font-bold text-xl text-[#1E293B]">
          EnergiP2P
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
        <button className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
          Log In
        </button>
        <button className="btn-primary">
          Sign Up
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
