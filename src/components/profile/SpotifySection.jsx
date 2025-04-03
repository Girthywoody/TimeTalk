import React from 'react';
import { useSpotify } from '../../hooks/useSpotify';
import { useAuth } from '../../hooks/useAuth';
import { Music, Disc3 } from 'lucide-react';

const SpotifyPlayer = ({ userId, username }) => {
  const { lastPlayed } = useSpotify(userId);
  const token = localStorage.getItem(`spotify_${userId}_access_token`);

  const handleReconnect = () => {
    const client_id = '42a2f6ce7af14905a55e1618e5baf746';
    const redirect_uri = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/callback'
      : 'https://time-talk.vercel.app/callback';
    
    const scope = [
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-read-private',
      'user-read-email',
      'user-library-read'
    ].join(' ');
    
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=${scope}&show_dialog=true`;
  };

  if (!token) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>{username} is not connected to Spotify</p>
        <button
          onClick={handleReconnect}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {lastPlayed ? (
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={lastPlayed.albumArt} 
              alt={`${lastPlayed.name} album art`}
              className="w-48 h-48 rounded-lg shadow-lg mb-4"
            />
            {lastPlayed.isPlaying && (
              <Disc3 className="absolute bottom-6 right-6 w-6 h-6 text-green-500 animate-spin" />
            )}
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {lastPlayed.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lastPlayed.artist}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No recent tracks
        </div>
      )}
    </div>
  );
};

const SpotifySection = () => {
  const { user } = useAuth();
  const { partnerProfile } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4" />
            Your Music
          </h3>
        </div>
        <SpotifyPlayer userId={user?.uid} username="You" />
      </div>

      {partnerProfile && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Music className="w-4 h-4" />
              {partnerProfile.displayName}'s Music
            </h3>
          </div>
          <SpotifyPlayer 
            userId={partnerProfile.uid} 
            username={partnerProfile.displayName} 
          />
        </div>
      )}
    </div>
  );
};

export default SpotifySection; 