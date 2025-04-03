// src/hooks/useSpotify.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds

export const useSpotify = (userId = null) => {
  const [lastPlayed, setLastPlayed] = useState(null);
  const { user } = useAuth();

  const getTokensForUser = (targetUserId) => {
    const prefix = targetUserId ? `spotify_${targetUserId}_` : 'spotify_';
    return {
      token: localStorage.getItem(`${prefix}access_token`),
      expiry: localStorage.getItem(`${prefix}token_expiry`),
      userId: localStorage.getItem(`${prefix}user_id`)
    };
  };

  const checkAndRefreshToken = (targetUserId) => {
    const { token, expiry } = getTokensForUser(targetUserId);
    
    if (!token || !expiry) return false;
    
    if (Date.now() > Number(expiry) - 300000) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const targetUserId = userId || user?.uid;
      if (!targetUserId || !checkAndRefreshToken(targetUserId)) {
        const { token } = getTokensForUser(targetUserId);
        if (token) {
          const prefix = targetUserId ? `spotify_${targetUserId}_` : 'spotify_';
          localStorage.removeItem(`${prefix}access_token`);
          localStorage.removeItem(`${prefix}token_expiry`);
          localStorage.removeItem(`${prefix}user_id`);
        }
        return;
      }
      
      const { token } = getTokensForUser(targetUserId);
      
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

    if (user) {
      fetchNowPlaying();
      const interval = setInterval(fetchNowPlaying, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user, userId]);

  return { lastPlayed };
};