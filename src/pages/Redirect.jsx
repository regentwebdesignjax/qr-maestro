import React, { useEffect } from 'react';

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
        // Call the backend function directly without SDK to avoid auth requirements
        const response = await fetch(`${window.location.origin}/_functions/handleQRRedirect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ short_code: shortCode })
        });
        
        const data = await response.json();
        
        if (data && data.url) {
          window.location.href = data.url;
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