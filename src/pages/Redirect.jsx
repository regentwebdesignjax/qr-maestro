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
        // Find QR code by short code
        const qrCodes = await base44.entities.QRCode.filter({ short_code: shortCode });
        
        if (qrCodes.length === 0 || !qrCodes[0].is_active) {
          window.location.href = '/';
          return;
        }

        const qrCode = qrCodes[0];

        // Track the scan
        try {
          await base44.entities.Scan.create({
            qr_code_id: qrCode.id,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent.split(' ').pop().split('/')[0],
          });

          // Update scan count
          await base44.entities.QRCode.update(qrCode.id, {
            scan_count: (qrCode.scan_count || 0) + 1
          });
        } catch (error) {
          console.error('Error tracking scan:', error);
        }

        // Redirect to destination
        window.location.href = qrCode.content;
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