import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

const EVENT_TYPES = [
  { value: 'concert', label: '🎵 Concert' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'comedy', label: '🎤 Comedy' },
  { value: 'theater', label: '🎭 Theater' },
  { value: 'flight', label: '✈️ Flight' },
  { value: 'custom', label: '✨ Other' },
] as const;

const TEMPLATES = [
  { id: 'concert', label: '🎵 Live Music', type: 'concert' },
  { id: 'sports', label: '⚽ Game Day', type: 'sports' },
  { id: 'flight', label: '✈️ Boarding Pass', type: 'flight' },
  { id: 'comedy', label: '🎤 Comedy Night', type: 'comedy' },
  { id: 'theater', label: '🎭 Theater', type: 'theater' },
  { id: 'custom', label: '✨ Classic', type: 'custom' },
];

export function NewStubPage() {
  const [type, setType] = useState('concert');
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueCountry, setVenueCountry] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [templateId, setTemplateId] = useState('concert');
  const [seat, setSeat] = useState('');
  const [companions, setCompanions] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const match = TEMPLATES.find(t => t.type === type);
    if (match) setTemplateId(match.id);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/stubs', {
        type,
        title,
        venueName: venueName || undefined,
        venueCity: venueCity || undefined,
        venueCountry: venueCountry || undefined,
        eventDate: new Date(eventDate).toISOString(),
        designTemplateId: templateId,
        personalData: {
          seat: seat || undefined,
          companions: companions || undefined,
        },
      });
      navigate(`/${user?.handle || 'me'}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create stub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log an Experience</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-stub-red/10 border border-stub-red/30 text-stub-red rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="type" className="block text-sm text-gray-400 mb-1">Event Type</label>
          <select id="type" className="input-field" value={type}
            onChange={(e) => setType(e.target.value)} aria-label="Event Type">
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Template</label>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} type="button"
                onClick={() => setTemplateId(t.id)}
                className={`text-xs p-2 rounded-lg border text-center transition-colors ${
                  templateId === t.id
                    ? 'border-stub-accent bg-stub-accent/10 text-stub-accent'
                    : 'border-stub-border text-gray-400 hover:border-gray-600'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm text-gray-400 mb-1">Title *</label>
          <input id="title" type="text" className="input-field" value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="Event name, artist, team..."
            required aria-label="Title" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="venue" className="block text-sm text-gray-400 mb-1">Venue</label>
            <input id="venue" type="text" className="input-field" value={venueName}
              onChange={(e) => setVenueName(e.target.value)} placeholder="Stadium, theater..."
              aria-label="Venue Name" />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm text-gray-400 mb-1">City</label>
            <input id="city" type="text" className="input-field" value={venueCity}
              onChange={(e) => setVenueCity(e.target.value)} placeholder="Location"
              aria-label="Venue City" />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm text-gray-400 mb-1">Date *</label>
          <input id="date" type="date" className="input-field" value={eventDate}
            onChange={(e) => setEventDate(e.target.value)} required aria-label="Date" />
        </div>

        <div className="border-t border-stub-border pt-4 mt-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Personal Details (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="seat" className="block text-sm text-gray-400 mb-1">Seat / Section</label>
              <input id="seat" type="text" className="input-field" value={seat}
                onChange={(e) => setSeat(e.target.value)} placeholder="Section 104, Row J"
                aria-label="Seat" />
            </div>
            <div>
              <label htmlFor="companions" className="block text-sm text-gray-400 mb-1">Who with?</label>
              <input id="companions" type="text" className="input-field" value={companions}
                onChange={(e) => setCompanions(e.target.value)} placeholder="Sarah, Mike..."
                aria-label="Companions" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6">
          {isLoading ? 'Saving...' : 'Add to Collection'}
        </button>
      </form>
    </div>
  );
}
