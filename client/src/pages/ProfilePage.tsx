import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StubCard } from '../components/StubCard';
import { useAuth } from '../store/auth';

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stub-red">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{handle || user?.displayName || 'Profile'}</h1>
          <p className="text-gray-500 text-sm">{stubs?.length || 0} stubs</p>
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
          {stubs.map((stub: any) => (
            <StubCard key={stub.id} stub={stub} />
          ))}
        </div>
      )}
    </div>
  );
}
