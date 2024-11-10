import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('spotify_user_id', data.id);
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_token_expiry', Date.now() + 3600000);
        navigate('/');
      });
    }
  }, [navigate]);

  return <div>Loading...</div>;
}; 