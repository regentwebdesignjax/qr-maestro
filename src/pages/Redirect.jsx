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
        const response = await fetch(`${window.location.origin}/_functions/handleQRRedirect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ short_code: shortCode })
        });
        
        if (!response.ok) {
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
          return;
        }

        const data = await response.json();
        
        if (data && data.url) {
          // Immediate redirect
          window.location.replace(data.url);
        } else {
          setError(true);
          setTimeout(() => window.location.href = '/', 2000);
        }
      } catch (err) {
        setError(true);
        setTimeout(() => window.location.href = '/', 2000);
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