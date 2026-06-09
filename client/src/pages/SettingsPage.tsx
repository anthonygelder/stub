import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const handleUpgrade = async () => {
    try {
      const { data } = await api.post('/billing/create-checkout');
      window.location.href = data.url;
    } catch { setMessage('Upgrade not available'); }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && <div className="bg-stub-accent/10 border border-stub-accent/30 text-stub-accent rounded-lg p-3 text-sm mb-4">{message}</div>}

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-400">Handle:</span> @{user?.handle}</p>
          <p><span className="text-gray-400">Email:</span> {user?.email}</p>
          <p><span className="text-gray-400">Plan:</span> <span className="text-stub-accent font-semibold">Stub {user?.planTier === 'plus' ? '+' : 'Free'}</span></p>
        </div>
      </div>

      {user?.planTier !== 'plus' && (
        <div className="card mb-4">
          <h2 className="font-semibold mb-3">Upgrade to Stub+</h2>
          <p className="text-gray-400 text-sm mb-3">Premium templates, wallet sync, Year in Review without watermark, and more.</p>
          <button onClick={handleUpgrade} className="btn-primary w-full text-sm">Upgrade — $4/month</button>
        </div>
      )}

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">Year in Review</h2>
        <p className="text-gray-400 text-sm mb-3">See your {new Date().getFullYear()} stats.</p>
        <button onClick={async () => {
          try {
            const { data } = await api.get(`/year-in-review/${new Date().getFullYear()}`, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            window.open(url);
          } catch { setMessage('Failed to generate'); }
        }} className="btn-secondary w-full text-sm">Generate {new Date().getFullYear()} Review</button>
      </div>

      <button onClick={() => { logout(); navigate('/'); }} className="btn-secondary w-full text-sm text-stub-red border-stub-red/30">
        Log Out
      </button>
    </div>
  );
}
