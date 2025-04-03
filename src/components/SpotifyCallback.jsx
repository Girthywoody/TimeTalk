import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    
    if (error) {
      setError(error);
      setTimeout(() => navigate('/'), 3000);
      return;
    }
    
    if (accessToken) {
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user data');
        return res.json();
      })
      .then(data => {
        const prefix = `spotify_${user.uid}_`;
        localStorage.setItem(`${prefix}user_id`, data.id);
        localStorage.setItem(`${prefix}access_token`, accessToken);
        localStorage.setItem(`${prefix}token_expiry`, Date.now() + 3600000);
        navigate('/');
      })
      .catch(err => {
        console.error('Error:', err);
        setError('Failed to authenticate with Spotify');
        setTimeout(() => navigate('/'), 3000);
      });
    } else {
      navigate('/');
    }
  }, [navigate, user]);

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  return <div className="p-4 text-center">Connecting to Spotify...</div>;
}; 