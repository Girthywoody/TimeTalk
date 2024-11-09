import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      // Token expires in 1 hour
      localStorage.setItem('spotify_token_expiry', Date.now() + 3600000);
      
      // Redirect back to the original page
      navigate('/');
    }
  }, [navigate]);

  return <div>Loading...</div>;
}; 