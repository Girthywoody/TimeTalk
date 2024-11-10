// src/hooks/useSpotify.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds

export const useSpotify = () => {
  const [lastPlayed, setLastPlayed] = useState(null);
  const { user } = useAuth();

  const checkAndRefreshToken = () => {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    
    if (!token || !expiry) return false;
    
    // If token is expired or will expire in next 5 minutes
    if (Date.now() > Number(expiry) - 300000) {
      // Clear the expired token
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expiry');
      
      // Redirect to Spotify auth
      const client_id = 'your_client_id';
      const redirect_uri = 'your_redirect_uri';
      const scope = 'user-read-currently-playing user-read-recently-played';
      
      window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=${scope}&show_dialog=true`;
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const fetchNowPlaying = async () => {
      if (!checkAndRefreshToken()) return;
      
      const token = localStorage.getItem('spotify_access_token');
      
      try {
        // First try to get currently playing
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 204 || response.status === 404) {
          // No track currently playing, fetch recently played
          const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            if (recentData.items?.length > 0) {
              const track = recentData.items[0].track;
              setLastPlayed({
                name: track.name,
                artist: track.artists[0].name,
                albumArt: track.album.images[0].url,
                isPlaying: false
              });
            }
          } else {
            console.error('Error fetching recent tracks:', recentResponse.status);
          }
        } else if (response.ok) {
          const data = await response.json();
          setLastPlayed({
            name: data.item.name,
            artist: data.item.artists[0].name,
            albumArt: data.item.album.images[0].url,
            isPlaying: true
          });
        } else {
          console.error('Error fetching current track:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);

    return () => clearInterval(interval);
  }, [user]);

  return { lastPlayed };
};