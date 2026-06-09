import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function ImportPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.post('/import/batch', {
        source: 'manual',
        items: Array.isArray(data) ? data : data.items || [data],
      });
      navigate('/import/review');
    } catch (err: any) {
      setError('Failed to import. Make sure the file is valid JSON with event data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Import Stubs</h1>
      
      <div className="card mb-6">
        <h2 className="font-semibold mb-3">Upload Import File</h2>
        <p className="text-gray-400 text-sm mb-4">
          Upload a JSON file with your event data. Each item needs: type, title, eventDate. Optional: venueName, venueCity, personalData.
        </p>
        {error && <div className="bg-stub-red/10 border border-stub-red/30 text-stub-red rounded-lg p-3 text-sm mb-4">{error}</div>}
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={isLoading} className="btn-primary w-full">
          {isLoading ? 'Importing...' : 'Choose JSON File'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Sample Import Format</h2>
        <pre className="bg-stub-black rounded-lg p-3 text-xs text-gray-400 overflow-x-auto">{`[
  {
    "type": "concert",
    "title": "Taylor Swift Eras Tour",
    "venueName": "SoFi Stadium",
    "venueCity": "Los Angeles",
    "eventDate": "2024-08-05T00:00:00Z",
    "personalData": { "seat": "Section 104" }
  }
]`}</pre>
      </div>
    </div>
  );
}
