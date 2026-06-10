import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StubStack } from '../components/StubStack';
import { Link } from 'react-router-dom';

export function FeedPage() {
  const { data: feed, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get('/feed');
      return data;
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading feed...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-stub-red">Failed to load feed.</p></div>;
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link to="/new" className="btn-primary text-sm px-4 py-2">+ New Stub</Link>
      </div>

      {!feed || feed.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No stubs in your feed</h2>
          <p className="text-gray-500 mb-6">Follow other collectors to see their stubs here.</p>
        </div>
      ) : (
        <StubStack stubs={feed} />
      )}
    </div>
  );
}
