import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { StubCard } from '../components/StubCard';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../store/auth';

const DEMO_STUBS = [
  {
    id: 'demo-1',
    personalData: { seat: 'Section 104, Row J, Seat 7', companions: 'with Sarah & Mike' },
    createdAt: '2024-09-20T00:00:00Z',
    event: {
      id: 'demo-event-1',
      type: 'concert',
      title: 'Radiohead — A Moon Shaped Pool Tour',
      venueName: 'Madison Square Garden',
      venueCity: 'New York',
      eventDate: '2024-09-20T00:00:00Z',
    },
  },
  {
    id: 'demo-2',
    personalData: { companions: 'family trip' },
    createdAt: '2024-07-04T00:00:00Z',
    event: {
      id: 'demo-event-2',
      type: 'flight',
      title: 'JFK → LHR',
      venueName: 'Delta Air Lines',
      venueCity: 'London',
      eventDate: '2024-07-04T00:00:00Z',
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
      eventDate: '2024-05-12T00:00:00Z',
    },
  },
];

export function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();

  const { data: stubs, isLoading, error } = useQuery({
    queryKey: ['stubs', handle],
    queryFn: async () => {
      const endpoint = handle ? `/users/${handle}/stubs` : '/stubs';
      const { data } = await api.get(endpoint);
      return data;
    },
    retry: 0,
  });

  const { data: followStats } = useQuery({
    queryKey: ['followStats', handle],
    queryFn: async () => { const { data } = await api.get(`/social/${handle}/follow-stats`); return data; },
    enabled: !!handle,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{handle || 'Stub'}</h1>
            <p className="text-gray-500 text-sm">preview</p>
          </div>
          <Link to="/new" className="btn-primary text-sm px-4 py-2 opacity-50 pointer-events-none">
            + New Stub
          </Link>
        </div>

        <div className="bg-stub-card border border-stub-border rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400">
            This is a static preview. Run the app locally to log your own experiences.
          </p>
        </div>

        <div className="grid gap-4">
          {DEMO_STUBS.map((stub, i) => (
            <motion.div
              key={stub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <StubCard stub={stub} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{handle || user?.displayName || 'Profile'}</h1>
            {handle && user && handle !== user.handle && (
              <FollowButton handle={handle} isFollowing={false} />
            )}
          </div>
          <p className="text-gray-500 text-sm">{stubs?.length || 0} stubs</p>
          {followStats && (
            <p className="text-gray-500 text-sm mt-1">
              <span className="font-semibold text-white">{followStats.followers}</span> followers ·{' '}
              <span className="font-semibold text-white">{followStats.following}</span> following
            </p>
          )}
        </div>
        {user && (
          <Link to="/new" className="btn-primary text-sm px-4 py-2">
            + New Stub
          </Link>
        )}
      </div>

      {!stubs || stubs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No stubs yet</h2>
          <p className="text-gray-500 mb-6">Start your collection by logging your first experience.</p>
          {user && (
            <Link to="/new" className="btn-primary">
              Log Your First Stub
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {stubs.map((stub: any, i: number) => (
            <motion.div
              key={stub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <StubCard stub={stub} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
