import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', handle: '', displayName: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      navigate(`/${data.user.handle}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Join Stub</h1>
        <p className="text-gray-400 text-center mb-8">Start your collection</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-stub-red/10 border border-stub-red/30 text-stub-red rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="displayName" className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input id="displayName" type="text" className="input-field" value={form.displayName}
              onChange={update('displayName')} placeholder="Your name" required
              aria-label="Display Name" />
          </div>

          <div>
            <label htmlFor="handle" className="block text-sm text-gray-400 mb-1">Handle</label>
            <input id="handle" type="text" className="input-field" value={form.handle}
              onChange={update('handle')} placeholder="yourhandle" required minLength={3} maxLength={30}
              pattern="[a-zA-Z0-9_]+" aria-label="Handle" />
            <p className="text-xs text-gray-600 mt-1">Letters, numbers, underscores. Your profile URL.</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
            <input id="email" type="email" className="input-field" value={form.email}
              onChange={update('email')} placeholder="you@example.com" required
              aria-label="Email" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">Password</label>
            <input id="password" type="password" className="input-field" value={form.password}
              onChange={update('password')} placeholder="Min 8 characters" required minLength={8}
              aria-label="Password" />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-stub-accent hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
