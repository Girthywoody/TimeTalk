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
      
      if (!token) {
        console.log('No Spotify token found');
        return;
      }

      try {
        // First try to get currently playing
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Current playing status:', response.status);

        if (response.status === 204) {
          // No track currently playing, fetch recently played
          const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            console.log('Recent track data:', recentData);
            
            if (recentData.items?.length > 0) {
              const track = recentData.items[0].track;
              setLastPlayed({
                name: track.name,
                artist: track.artists[0].name,
                albumArt: track.album.images[0].url,
                isPlaying: false
              });
            }
          }
        } else if (response.ok) {
          const data = await response.json();
          console.log('Currently playing data:', data);
          
          setLastPlayed({
            name: data.item.name,
            artist: data.item.artists[0].name,
            albumArt: data.item.album.images[0].url,
            isPlaying: true
          });
        } else {
          // Token might be expired
          console.log('Spotify API error:', response.status);
          // You might want to trigger a token refresh here
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