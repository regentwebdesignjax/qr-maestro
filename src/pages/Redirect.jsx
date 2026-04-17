import { useEffect } from 'react';

export default function Redirect() {
  useEffect(() => {
    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        window.location.href = '/';
        return;
      }

      try {
        // Call the function directly via HTTP — no auth needed, uses asServiceRole inside
        const res = await fetch(`${window.location.origin}/functions/redirect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Redirect error:', error);
        window.location.href = '/';
      }
    };

    run();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}