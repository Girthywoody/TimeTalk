import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Preview failed');
        const data = await response.json();
        setPreview(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 mt-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block mt-2 text-blue-500 hover:underline"
      >
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {preview.image && (
        <div 
          className="h-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${preview.image})` }}
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          {preview.favicon && (
            <img src={preview.favicon} alt="" className="w-4 h-4" />
          )}
          <span>{new URL(url).hostname}</span>
          <ExternalLink size={14} />
        </div>
        <h3 className="font-medium mb-1 line-clamp-2">
          {preview.title}
        </h3>
        {preview.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreview;