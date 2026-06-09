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
    </div>
  );
}
