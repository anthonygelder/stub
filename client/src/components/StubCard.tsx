import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { ShareButton } from './ShareButton';

interface StubCardProps {
  stub: {
    id: string;
    generatedImageUrl?: string;
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

const TYPE_CONFIG: Record<string, {
  emoji: string;
  label: string;
  gradient: string;
  accent: string;
  bg: string;
}> = {
  concert: {
    emoji: '🎵', label: 'LIVE MUSIC',
    gradient: 'from-purple-900/60 via-fuchsia-900/40 to-stub-card',
    accent: '#c084fc', bg: 'rgba(192,132,252,0.08)',
  },
  sports: {
    emoji: '⚽', label: 'GAME DAY',
    gradient: 'from-emerald-900/60 via-green-900/40 to-stub-card',
    accent: '#34d399', bg: 'rgba(52,211,153,0.08)',
  },
  comedy: {
    emoji: '🎤', label: 'COMEDY NIGHT',
    gradient: 'from-rose-900/60 via-pink-900/40 to-stub-card',
    accent: '#fb7185', bg: 'rgba(251,113,133,0.08)',
  },
  theater: {
    emoji: '🎭', label: 'THEATER',
    gradient: 'from-amber-900/60 via-orange-900/40 to-stub-card',
    accent: '#fbbf24', bg: 'rgba(251,191,36,0.08)',
  },
  flight: {
    emoji: '✈️', label: 'BOARDING PASS',
    gradient: 'from-sky-900/60 via-blue-900/40 to-stub-card',
    accent: '#38bdf8', bg: 'rgba(56,189,248,0.08)',
  },
  custom: {
    emoji: '✨', label: 'MEMORY',
    gradient: 'from-stub-accent/20 via-stub-accent/10 to-stub-card',
    accent: '#f5a623', bg: 'rgba(245,166,35,0.08)',
  },
};

function ReactionBar({ stubId, accent }: { stubId: string; accent: string }) {
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
  const config: Record<string, { emoji: string; label: string }> = {
    was_there: { emoji: '✅', label: 'Was there' },
    jealous: { emoji: '😮', label: 'Jealous' },
    want_to_go: { emoji: '🎯', label: 'Want to go' },
  };

  return (
    <div className="flex gap-1.5">
      {types.map(t => (
        <button key={t} onClick={() => react(t)}
          className="text-xs px-2.5 py-1.5 rounded-full border transition-all duration-200"
          style={{
            borderColor: myType === t ? accent : 'rgba(255,255,255,0.08)',
            backgroundColor: myType === t ? `${accent}18` : 'transparent',
            color: myType === t ? accent : '#9ca3af',
          }}
        >
          {config[t].emoji} {counts[t] || 0}
        </button>
      ))}
    </div>
  );
}

export function StubCard({ stub }: StubCardProps) {
  const event = stub.event;
  const typeConfig = TYPE_CONFIG[event.type] || TYPE_CONFIG.custom;
  const date = new Date(event.eventDate);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = event.eventDate ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;

  // Generate a faux barcode pattern
  const barcodeLines = Array.from({ length: 40 }, () => Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Ticket body */}
      <div
        className="relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:scale-[1.01]"
        style={{
          backgroundColor: '#161616',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Perforation dots at top */}
        <div className="absolute top-0 left-0 right-0 h-3 flex justify-around items-center z-10 pointer-events-none" style={{ transform: 'translateY(-50%)' }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0a0a0a' }} />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${typeConfig.gradient} pointer-events-none`} />

        {/* Content */}
        <div className="relative p-5 pt-4">
          {/* Header: type badge + date */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider"
              style={{ backgroundColor: typeConfig.bg, color: typeConfig.accent }}
            >
              <span className="text-base">{typeConfig.emoji}</span>
              {typeConfig.label}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium tracking-wide" style={{ color: typeConfig.accent }}>
                {weekday.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Generated image */}
          {stub.generatedImageUrl && (
            <img src={stub.generatedImageUrl} alt="" className="w-full rounded-xl mb-4" loading="lazy" />
          )}

          {/* Main event title */}
          <h3 className="text-3xl font-black tracking-tight leading-tight mb-1" style={{ color: '#f1f1f1' }}>
            {event.title}
          </h3>

          {/* Subtitle / venue */}
          {event.venueName && (
            <p className="text-sm font-medium tracking-wide mt-1" style={{ color: '#6b7280' }}>
              {event.venueName}
              {event.venueCity && <span className="text-gray-600"> · {event.venueCity}</span>}
            </p>
          )}

          {/* Date block — large, stylistic */}
          <div className="flex items-end gap-3 mt-5">
            <span className="text-5xl font-black leading-none" style={{ color: typeConfig.accent, opacity: 0.9 }}>
              {String(day).padStart(2, '0')}
            </span>
            <div className="mb-0.5">
              <p className="text-sm font-bold tracking-widest uppercase leading-tight" style={{ color: '#9ca3af' }}>
                {month}
              </p>
              <p className="text-xs font-medium tracking-wider leading-tight" style={{ color: '#4b5563' }}>
                {year}
              </p>
            </div>
            {time && (
              <div className="ml-auto mb-0.5 text-right">
                <p className="text-lg font-bold tracking-wider leading-none" style={{ color: '#d1d5db' }}>
                  {time}
                </p>
              </div>
            )}
          </div>

          {/* Seat / personal details */}
          {stub.personalData?.seat && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#6b7280' }}>
                Seat
              </p>
              <p className="text-base font-bold tracking-wide" style={{ color: typeConfig.accent }}>
                {stub.personalData.seat}
              </p>
            </div>
          )}
          {stub.personalData?.companions && (
            <div className="mt-2">
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#6b7280' }}>
                With
              </p>
              <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                {stub.personalData.companions}
              </p>
            </div>
          )}

          {/* Perforation divider */}
          <div className="my-5 flex items-center gap-1" style={{ marginLeft: '-20px', marginRight: '-20px' }}>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0a0a0a', marginTop: '-5px', marginBottom: '-5px', position: 'relative', zIndex: 1 }} />
              ))}
            </div>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Bottom section: barcode + reactions */}
          <div className="flex items-end justify-between">
            <div className="flex gap-1 items-end h-8 opacity-30">
              {barcodeLines.map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: `${w}px`,
                    height: `${12 + Math.random() * 20}px`,
                    backgroundColor: typeConfig.accent,
                    borderRadius: '1px',
                  }}
                />
              ))}
            </div>
            <ShareButton stubId={stub.id} />
          </div>

          {/* Reactions */}
          <div className="mt-3">
            <ReactionBar stubId={stub.id} accent={typeConfig.accent} />
          </div>
        </div>

        {/* Bottom perforation */}
        <div className="absolute bottom-0 left-0 right-0 h-3 flex justify-around items-center z-10 pointer-events-none" style={{ transform: 'translateY(50%)' }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0a0a0a' }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
