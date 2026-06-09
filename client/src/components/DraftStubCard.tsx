import { useState } from 'react';
import { api } from '../api/client';

interface DraftStubCardProps {
  stub: { id: string; event: { type: string; title: string; venueName?: string; venueCity?: string; eventDate: string }; personalData: any; importSource: string };
  onPublish: (id: string) => void;
  onReject: (id: string) => void;
}

const TYPE_EMOJI: Record<string, string> = { concert: '🎵', sports: '⚽', comedy: '🎤', theater: '🎭', flight: '✈️', custom: '✨' };

export function DraftStubCard({ stub, onPublish, onReject }: DraftStubCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const event = stub.event;
  const date = new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await api.post(`/import/${stub.id}/publish`);
      onPublish(stub.id);
    } catch { setIsPublishing(false); }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await api.delete(`/import/${stub.id}/reject`);
      onReject(stub.id);
    } catch { setIsRejecting(false); }
  };

  return (
    <div className="card border-stub-accent/20">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{TYPE_EMOJI[event.type] || '✨'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{event.title}</h3>
          {event.venueName && <p className="text-gray-400 text-sm mt-1">{event.venueName}{event.venueCity ? ` · ${event.venueCity}` : ''}</p>}
          <p className="text-gray-500 text-sm mt-1">{date}</p>
          {stub.personalData?.seat && <p className="text-stub-accent text-xs mt-1">{stub.personalData.seat}</p>}
          <p className="text-gray-600 text-xs mt-2">From: {stub.importSource}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-stub-border">
        <button onClick={handlePublish} disabled={isPublishing} className="btn-primary text-xs px-3 py-1.5 flex-1">
          {isPublishing ? '...' : '✓ Publish'}
        </button>
        <button onClick={handleReject} disabled={isRejecting} className="btn-secondary text-xs px-3 py-1.5">
          {isRejecting ? '...' : '✕ Discard'}
        </button>
      </div>
    </div>
  );
}
