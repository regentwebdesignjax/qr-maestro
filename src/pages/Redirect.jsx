import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Redirect() {
  useEffect(() => {
    const handleRedirect = async () => {
      const pathParts = window.location.pathname.split('/');
      const shortCode = pathParts[pathParts.length - 1];

      if (!shortCode) {
        window.location.href = '/';
        return;
      }

      try {
        // Always use backend function to handle redirects (works for both authenticated and public users)
        const response = await base44.functions.invoke('handleQRRedirect', { short_code: shortCode });
        
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
        window.location.href = '/';
      }
    };

    handleRedirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}