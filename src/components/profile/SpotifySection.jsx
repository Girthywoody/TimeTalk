import React from 'react';
import { useSpotify } from '../../hooks/useSpotify';
import { Music, Disc3 } from 'lucide-react';

const SpotifySection = () => {
  const { lastPlayed } = useSpotify();
  const token = localStorage.getItem('spotify_access_token');

  if (!token) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4" />
            Spotify
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Not connected to Spotify
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Music className="w-4 h-4" />
          {lastPlayed?.isPlaying ? 'Currently Playing' : 'Recently Played'}
        </h3>
      </div>
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
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No recent tracks
            <div className="mt-2 text-xs">
              <p>Token exists: {token ? 'Yes' : 'No'}</p>
              <p>Token: {token ? `${token.substring(0, 10)}...` : 'None'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifySection; 