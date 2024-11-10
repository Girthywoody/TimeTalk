// src/hooks/useSpotify.js
import { useState, useEffect } from 'react';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds

export const useSpotify = () => {
  const [lastPlayed, setLastPlayed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getSpotifyToken = async () => {
    try {
      const storedToken = localStorage.getItem('spotify_access_token');
      const tokenExpiry = localStorage.getItem('spotify_token_expiry');
      
      if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        setIsAuthenticated(true);
        return storedToken;
      }

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      if (!clientId) {
        throw new Error('Spotify Client ID is not configured');
      }

      const redirectUri = `https://time-talk.vercel.app/callback`;
      const scope = 'user-read-currently-playing user-read-recently-played';
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      
      window.location.href = authUrl;
      return null;
    } catch (err) {
      console.error('Error getting Spotify token:', err);
      setError('Failed to authenticate with Spotify');
      return null;
    }
  };

  const fetchCurrentlyPlaying = async (token) => {
    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.status === 204) {
        // No track currently playing, fall back to recently played
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch current track');
      }

      const data = await response.json();
      if (data && data.item) {
        return {
          name: data.item.name,
          artist: data.item.artists[0].name,
          albumArt: data.item.album.images[0]?.url,
          url: data.item.external_urls.spotify,
          isPlaying: data.is_playing
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching current track:', err);
      return null;
    }
  };

  const fetchLastPlayed = async (token) => {
    try {
      const currentlyPlaying = await fetchCurrentlyPlaying(token);
      if (currentlyPlaying) {
        setLastPlayed(currentlyPlaying);
        return;
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
          url: track.external_urls.spotify,
          isPlaying: false
        });
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to fetch track information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;

    const initializeSpotify = async () => {
      const token = await getSpotifyToken();
      if (token) {
        await fetchLastPlayed(token);
        // Set up polling interval
        interval = setInterval(async () => {
          await fetchLastPlayed(token);
        }, POLLING_INTERVAL);
      }
    };

    initializeSpotify();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  return { lastPlayed, loading, error, refetch: () => fetchLastPlayed(localStorage.getItem('spotify_access_token')) };
};