import React from 'react';
import { useSpotify } from '../../hooks/useSpotify';
import { Music } from 'lucide-react';

const SpotifySection = () => {
  const { lastPlayed } = useSpotify();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Music className="w-4 h-4" />
          Recently Played
        </h3>
      </div>
      <div className="p-6">
        {lastPlayed ? (
          <div className="flex flex-col items-center">
            <img 
              src={lastPlayed.albumArt} 
              alt={`${lastPlayed.name} album art`}
              className="w-48 h-48 rounded-lg shadow-lg mb-4"
            />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifySection; 