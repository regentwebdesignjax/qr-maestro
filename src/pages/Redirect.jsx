import React, { useEffect, useState } from 'react';

export default function Redirect() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      const pathParts = window.location.pathname.split('/');
      const shortCode = pathParts[pathParts.length - 1];

      if (!shortCode || shortCode === 'r') {
        window.location.href = '/';
        return;
      }

      try {
        console.log('Redirect: fetching for shortCode:', shortCode);
        const response = await fetch(`${window.location.origin}/_functions/handleQRRedirect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ short_code: shortCode })
        });
        
        console.log('Redirect: response status:', response.status);
        
        if (!response.ok) {
          console.error('Redirect: response not OK');
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
          return;
        }

        const data = await response.json();
        console.log('Redirect: data received:', data);
        
        if (data && data.url) {
          console.log('Redirect: redirecting to:', data.url);
          // Use window.location.href for external redirects
          window.location.href = data.url;
        } else {
          console.error('Redirect: no URL in data');
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
        }
      } catch (err) {
        console.error('Redirect: error caught:', err);
        setError(true);
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    handleRedirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 text-lg mb-2">QR Code not found</p>
            <p className="text-gray-600">Redirecting to home...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}