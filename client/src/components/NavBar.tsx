import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

export function NavBar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const links = [
    { to: '/feed', label: 'Feed' },
    { to: `/${user?.handle}`, label: 'Profile' },
    { to: '/new', label: '+ New' },
    { to: '/import', label: 'Import' },
  ];

  return (
    <nav className="border-b border-stub-border bg-stub-dark sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="font-bold text-stub-accent text-lg">Stub</Link>
        <div className="flex gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === l.to ? 'bg-stub-accent/10 text-stub-accent' : 'text-gray-400 hover:text-white'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
