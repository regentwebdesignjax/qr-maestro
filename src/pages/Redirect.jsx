import React, { useEffect, useState } from 'react';

export default function Redirect() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shortCode = urlParams.get('code');

      console.log('=== REDIRECT PAGE LOADED ===');
      console.log('Full URL:', window.location.href);
      console.log('Short code extracted:', shortCode);

      if (!shortCode) {
        console.error('No short code found, redirecting home');
        window.location.href = '/';
        return;
      }

      try {
        const fetchUrl = `${window.location.origin}/_functions/handleQRRedirect`;
        console.log('Fetching from:', fetchUrl);
        console.log('Request body:', { short_code: shortCode });
        
        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ short_code: shortCode })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response not OK. Body:', errorText);
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
          return;
        }

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data && data.url) {
          console.log('=== REDIRECTING NOW TO:', data.url);
          // Try multiple redirect methods
          setTimeout(() => {
            window.location.href = data.url;
          }, 100);
        } else {
          console.error('No URL in response data');
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
        }
      } catch (err) {
        console.error('Exception caught:', err);
        console.error('Error details:', err.message, err.stack);
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