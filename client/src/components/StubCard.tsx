import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface StubCardProps {
  stub: {
    id: string;
    personalData: any;
    createdAt: string;
    event: {
      id: string;
      type: string;
      title: string;
      venueName?: string;
      venueCity?: string;
      eventDate: string;
    };
  };
}

const TYPE_EMOJI: Record<string, string> = {
  concert: '🎵',
  sports: '⚽',
  comedy: '🎤',
  theater: '🎭',
  flight: '✈️',
  custom: '✨',
};

function ReactionBar({ stubId }: { stubId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myType, setMyType] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/stubs/${stubId}/reactions`).then(r => {
      if (r.data?.counts) setCounts(r.data.counts);
    }).catch(() => {});
  }, [stubId]);

  const react = async (type: string) => {
    try {
      const { data } = await api.post(`/stubs/${stubId}/reactions`, { type });
      setCounts(prev => {
        const next = { ...prev };
        if (data.removed) next[type] = Math.max(0, (next[type] || 0) - 1);
        else next[type] = (next[type] || 0) + 1;
        return next;
      });
      setMyType(data.removed ? null : type);
    } catch {}
  };

  const types = ['was_there', 'jealous', 'want_to_go'] as const;
  const emojis: Record<string, string> = { was_there: '✅', jealous: '😮', want_to_go: '🎯' };

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-stub-border">
      {types.map(t => (
        <button key={t} onClick={() => react(t)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            myType === t ? 'border-stub-accent bg-stub-accent/10 text-stub-accent' : 'border-stub-border text-gray-500 hover:border-gray-600'
          }`}>
          {emojis[t]} {counts[t] || 0}
        </button>
      ))}
    </div>
  );
}

export function StubCard({ stub }: StubCardProps) {
  const event = stub.event;
  const date = new Date(event.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="card hover:border-stub-accent/30 transition-colors cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{TYPE_EMOJI[event.type] || '✨'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{event.title}</h3>
          {event.venueName && (
            <p className="text-gray-400 text-sm mt-1">
              {event.venueName}{event.venueCity ? ` · ${event.venueCity}` : ''}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">{date}</p>
          {stub.personalData?.seat && (
            <p className="text-stub-accent text-xs mt-2">{stub.personalData.seat}</p>
          )}
        </div>
      </div>
      <ReactionBar stubId={stub.id} />
    </div>
  );
}
