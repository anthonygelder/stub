import { useState } from 'react';

interface ShareButtonProps {
  stubId: string;
  label?: string;
}

export function ShareButton({ stubId, label = 'Share' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${stubId}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Stub', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleShare} className="btn-secondary text-xs px-3 py-1.5">
      {copied ? 'Copied!' : label}
    </button>
  );
}
