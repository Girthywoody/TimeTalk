// src/hooks/useSpotify.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds

export const useSpotify = () => {
  const [lastPlayed, setLastPlayed] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNowPlaying = async () => {
      const token = localStorage.getItem('spotify_access_token');
      const spotifyUserId = localStorage.getItem('spotify_user_id');
      
      // Only fetch if we have both the token and the correct Spotify ID for this user
      if (token && spotifyUserId && user?.spotifyId === spotifyUserId) {
        try {
          const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.status === 204) {
            // No track currently playing, fetch recently played
            const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
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
          } else if (response.ok) {
            const data = await response.json();
            setLastPlayed({
              name: data.item.name,
              artist: data.item.artists[0].name,
              albumArt: data.item.album.images[0].url,
              isPlaying: data.is_playing
            });
          }
        } catch (error) {
          console.error('Error fetching Spotify data:', error);
        }
      }
    };

    const interval = setInterval(fetchNowPlaying, 10000);
    fetchNowPlaying();

    return () => clearInterval(interval);
  }, [user?.spotifyId]);

  return { lastPlayed };
};