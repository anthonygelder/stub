import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { DraftStubCard } from '../components/DraftStubCard';

export function ImportReviewPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/import/drafts').then(r => { setDrafts(r.data); setIsLoading(false); }).catch(() => { setError('Failed to load drafts'); setIsLoading(false); });
  }, []);

  const handlePublish = (id: string) => setDrafts(prev => prev.filter(d => d.id !== id));
  const handleReject = (id: string) => setDrafts(prev => prev.filter(d => d.id !== id));

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading drafts...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-stub-red">{error}</p></div>;

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Review Imports</h1>
        <span className="text-gray-500 text-sm">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📥</div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No drafts to review</h2>
          <p className="text-gray-500 mb-6">All caught up!</p>
          <Link to="/import" className="btn-primary">Import More</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((stub: any) => (
            <DraftStubCard key={stub.id} stub={stub} onPublish={handlePublish} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}
