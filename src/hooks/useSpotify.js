// src/hooks/useSpotify.js
import { useState, useEffect } from 'react';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const useSpotify = () => {
  const [lastPlayed, setLastPlayed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSpotifyToken = async () => {
    try {
      // Check if we have a token in localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const tokenExpiry = localStorage.getItem('spotify_token_expiry');
      
      // If token exists and is not expired, use it
      if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        return storedToken;
      }

      // If no token or expired, redirect to Spotify auth
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = `${window.location.origin}/callback`;
      const scope = 'user-read-recently-played';
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      
      window.location.href = authUrl;
      return null;
    } catch (err) {
      console.error('Error getting Spotify token:', err);
      setError('Failed to authenticate with Spotify');
      return null;
    }
  };

  const fetchLastPlayed = async () => {
    try {
      setLoading(true);
      const token = await getSpotifyToken();
      
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch last played track');
      }

      const data = await response.json();
      const track = data.items[0]?.track;
      
      if (track) {
        setLastPlayed({
          name: track.name,
          artist: track.artists[0].name,
          albumArt: track.album.images[0]?.url,
          url: track.external_urls.spotify
        });
      }
    } catch (err) {
      console.error('Error fetching last played:', err);
      setError('Failed to fetch last played track');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastPlayed();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLastPlayed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { lastPlayed, loading, error, refetch: fetchLastPlayed };
};