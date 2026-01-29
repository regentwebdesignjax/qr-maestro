import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function QRCodePreview({ qrData }) {
  const canvasRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!qrData || !qrData.content) return;

    const generateQR = async () => {
      try {
        const canvas = canvasRef.current;
        
        // Prepare content based on type
        let content = qrData.content;
        
        if (qrData.type === 'dynamic' && qrData.short_code) {
          // For dynamic QR codes, use redirect URL
          content = `${window.location.origin}/r/${qrData.short_code}`;
        } else if (qrData.content_type === 'wifi') {
          // Format WiFi data
          const lines = qrData.content.split('\n');
          const ssid = lines.find(l => l.startsWith('SSID:'))?.split(':')[1]?.trim() || '';
          const password = lines.find(l => l.startsWith('Password:'))?.split(':')[1]?.trim() || '';
          const encryption = lines.find(l => l.startsWith('Encryption:'))?.split(':')[1]?.trim() || 'WPA';
          content = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
        } else if (qrData.content_type === 'vcard') {
          // Format vCard data
          const lines = qrData.content.split('\n');
          const name = lines.find(l => l.startsWith('Name:'))?.split(':')[1]?.trim() || '';
          const phone = lines.find(l => l.startsWith('Phone:'))?.split(':')[1]?.trim() || '';
          const email = lines.find(l => l.startsWith('Email:'))?.split(':')[1]?.trim() || '';
          const company = lines.find(l => l.startsWith('Company:'))?.split(':')[1]?.trim() || '';
          
          content = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nEND:VCARD`;
        }

        await QRCode.toCanvas(canvas, content, {
          width: 300,
          margin: 2,
          color: {
            dark: qrData.design_config?.foreground_color || '#000000',
            light: qrData.design_config?.background_color || '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });

        const url = canvas.toDataURL();
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [qrData]);

  const handleDownload = (format) => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.${format}`;
    
    if (format === 'png') {
      link.href = qrCodeUrl;
    } else if (format === 'svg') {
      // For SVG, we'll use the canvas data as fallback
      // In a production app, you'd want to generate actual SVG
      link.href = qrCodeUrl;
    }
    
    link.click();
  };

  if (!qrData) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="mb-2">Fill in the form and click "Generate Preview"</p>
          <p className="text-sm">Your QR code will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {qrData.type === 'dynamic' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a dynamic QR code. The destination can be changed later without updating the QR code.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <canvas ref={canvasRef} />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <strong>Name:</strong> {qrData.name}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Type:</strong> {qrData.type === 'static' ? 'Static' : 'Dynamic'}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Content Type:</strong> {qrData.content_type}
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => handleDownload('png')} 
          variant="outline"
          className="flex-1"
          disabled={!qrCodeUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
        <Button 
          onClick={() => handleDownload('svg')} 
          variant="outline"
          className="flex-1"
          disabled={!qrCodeUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download SVG
        </Button>
      </div>
    </div>
  );
}