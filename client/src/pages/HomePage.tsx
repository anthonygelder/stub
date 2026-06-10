import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { StubStack } from '../components/StubStack';

const DEMO_STUBS = [
  {
    id: 'demo-1',
    personalData: { seat: 'Section 104, Row J, Seat 7' },
    createdAt: '2024-09-20T00:00:00Z',
    event: {
      id: 'demo-event-1',
      type: 'concert',
      title: 'Radiohead',
      venueName: 'Madison Square Garden',
      venueCity: 'New York',
      eventDate: '2024-09-20T20:00:00Z',
    },
  },
  {
    id: 'demo-2',
    personalData: {},
    createdAt: '2024-07-04T00:00:00Z',
    event: {
      id: 'demo-event-2',
      type: 'flight',
      title: 'JFK → LHR',
      venueName: 'Delta Air Lines',
      venueCity: 'London',
      eventDate: '2024-07-04T14:30:00Z',
    },
  },
  {
    id: 'demo-3',
    personalData: { seat: 'Behind home plate' },
    createdAt: '2024-05-12T00:00:00Z',
    event: {
      id: 'demo-event-3',
      type: 'sports',
      title: 'Yankees vs Red Sox',
      venueName: 'Yankee Stadium',
      venueCity: 'Bronx, NY',
      eventDate: '2024-05-12T19:05:00Z',
    },
  },
];

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
        <div className="text-7xl mb-6">🎟️</div>
        <h1 className="text-5xl font-bold mb-4">Stub</h1>
        <p className="text-xl text-gray-400 mb-2 max-w-lg mx-auto">
          Digital mementos for live experiences
        </p>
        <p className="text-gray-500 mb-8">
          Every concert, flight, or game deserves a keepsake.
        </p>

        {isAuthenticated ? (
          <div className="flex gap-3 justify-center">
            <Link to={`/${user?.handle}`} className="btn-primary">
              My Collection
            </Link>
            <Link to="/feed" className="btn-secondary">
              Feed
            </Link>
            <Link to="/new" className="btn-secondary">
              + New Stub
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn-secondary">
              Log In
            </Link>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-24 grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="text-3xl mb-3">🎵</div>
          <h3 className="font-semibold mb-2">Log Experiences</h3>
          <p className="text-gray-400 text-sm">
            Concerts, sports, flights, comedy — any live moment becomes a beautiful digital stub.
          </p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-semibold mb-2">Import from Wallet</h3>
          <p className="text-gray-400 text-sm">
            Connect Apple or Google Wallet to pull in years of tickets and boarding passes instantly.
          </p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-3">🌐</div>
          <h3 className="font-semibold mb-2">Share & Discover</h3>
          <p className="text-gray-400 text-sm">
            Build your collection, find others who were there, and share stubs anywhere.
          </p>
        </div>
      </div>

      {/* Demo preview */}
      <div className="border-t border-stub-border py-16">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-400 text-center mb-6">Demo Collection</h2>
          <StubStack stubs={DEMO_STUBS} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-stub-border py-8 text-center text-gray-600 text-sm">
        <p>This is a static preview. Run locally to log your own stubs.</p>
      </div>
    </div>
  );
}
