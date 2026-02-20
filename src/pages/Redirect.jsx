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
        // Call the backend function using the Base44 SDK
        // The function uses service role internally, so it should work without user auth
        const response = await base44.functions.invoke('handleQRRedirect', { short_code: shortCode });
        
        console.log('Redirect response:', response);
        
        if (response.data && response.data.url) {
          console.log('Redirecting to:', response.data.url);
          window.location.href = response.data.url;
        } else {
          console.error('No URL in response');
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
        console.error('Error details:', error.response?.data);
        // If there's an authentication error, try direct API call
        try {
          const directResponse = await fetch(`${window.location.origin}/_functions/handleQRRedirect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ short_code: shortCode })
          });
          
          const data = await directResponse.json();
          if (data && data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
        }
        
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