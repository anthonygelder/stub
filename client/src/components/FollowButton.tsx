import { useState } from 'react';
import { api } from '../api/client';

interface FollowButtonProps {
  handle: string;
  isFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowButton({ handle, isFollowing: initialFollowing, onToggle }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await api.post('/social/unfollow', { handle });
        setIsFollowing(false);
        onToggle?.(false);
      } else {
        await api.post('/social/follow', { handle });
        setIsFollowing(true);
        onToggle?.(true);
      }
    } catch {
      // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={isFollowing
        ? 'btn-secondary text-sm px-4 py-2'
        : 'btn-primary text-sm px-4 py-2'
      }
    >
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
