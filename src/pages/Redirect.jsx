import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

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
        const response = await base44.functions.invoke('redirect', { code });
        const url = response?.data?.url;
        if (url) {
          window.location.href = url;
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