import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function QRCodePreview({ qrData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!qrData || !qrData.content) return;

    const generateQR = async () => {
      try {
        const canvas = canvasRef.current;
        
        // Prepare content based on type
        let content = qrData.content;
        
        if (qrData.type === 'dynamic' && qrData.short_code) {
          content = `${window.location.origin}/r/${qrData.short_code}`;
        } else if (qrData.content_type === 'wifi') {
          const lines = qrData.content.split('\n');
          const ssid = lines.find(l => l.startsWith('SSID:'))?.split(':')[1]?.trim() || '';
          const password = lines.find(l => l.startsWith('Password:'))?.split(':')[1]?.trim() || '';
          const encryption = lines.find(l => l.startsWith('Encryption:'))?.split(':')[1]?.trim() || 'WPA';
          content = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
        } else if (qrData.content_type === 'vcard') {
          const lines = qrData.content.split('\n');
          const name = lines.find(l => l.startsWith('Name:'))?.split(':')[1]?.trim() || '';
          const phone = lines.find(l => l.startsWith('Phone:'))?.split(':')[1]?.trim() || '';
          const email = lines.find(l => l.startsWith('Email:'))?.split(':')[1]?.trim() || '';
          const company = lines.find(l => l.startsWith('Company:'))?.split(':')[1]?.trim() || '';
          content = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nEND:VCARD`;
        }

        const qrStyle = qrData.design_config?.qr_style || 'squares';
        
        await QRCode.toCanvas(canvas, content, {
          width: 300,
          margin: 2,
          color: {
            dark: qrData.design_config?.foreground_color || '#000000',
            light: qrData.design_config?.background_color || '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });

        // Apply QR style modifications
        if (qrStyle === 'dots' || qrStyle === 'rounded') {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple style transformation
          if (qrStyle === 'dots') {
            // Create dots effect by drawing circles
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = qrData.design_config?.background_color || '#ffffff';
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            const moduleSize = Math.floor(canvas.width / 37);
            tempCtx.fillStyle = qrData.design_config?.foreground_color || '#000000';
            
            for (let y = 0; y < canvas.height; y += moduleSize) {
              for (let x = 0; x < canvas.width; x += moduleSize) {
                const pixelIndex = (y * canvas.width + x) * 4;
                if (data[pixelIndex] < 128) {
                  tempCtx.beginPath();
                  tempCtx.arc(x + moduleSize / 2, y + moduleSize / 2, moduleSize / 3, 0, Math.PI * 2);
                  tempCtx.fill();
                }
              }
            }
            ctx.drawImage(tempCanvas, 0, 0);
          }
        }

        // Add logo if provided
        if (qrData.design_config?.logo_url) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          logo.onload = () => {
            const ctx = canvas.getContext('2d');
            const logoSize = canvas.width * 0.2;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            ctx.fillStyle = qrData.design_config?.background_color || '#ffffff';
            ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            const url = canvas.toDataURL();
            setQrCodeUrl(url);
          };
          logo.src = qrData.design_config.logo_url;
        } else {
          const url = canvas.toDataURL();
          setQrCodeUrl(url);
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [qrData]);

  const handleDownload = async (format) => {
    if (!containerRef.current) return;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${qrData.name || 'qrcode'}.${format}`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
    }
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

  const frameStyle = qrData.design_config?.frame_style || 'none';
  const frameText = qrData.design_config?.frame_text || 'Scan Me';
  const frameColor = qrData.design_config?.frame_color || '#000000';

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
        <div ref={containerRef} className="relative inline-block">
          {/* Frame Wrapper */}
          {frameStyle !== 'none' && (
            <div className={`
              ${frameStyle === 'basic' ? 'border-4 p-4' : ''}
              ${frameStyle === 'modern' ? 'shadow-xl rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white' : ''}
              ${frameStyle === 'badge' ? 'rounded-3xl p-8 shadow-2xl' : ''}
            `} style={{ 
              borderColor: frameStyle === 'basic' ? frameColor : 'transparent',
              background: frameStyle === 'badge' ? `linear-gradient(135deg, ${frameColor}15, ${frameColor}05)` : undefined
            }}>
              {/* Frame Text Top */}
              {frameText && (
                <div className="text-center mb-4">
                  <p className="font-bold text-lg" style={{ color: frameColor }}>
                    {frameText}
                  </p>
                </div>
              )}
              
              <canvas ref={canvasRef} />
              
              {/* Frame Text Bottom */}
              {frameStyle === 'modern' && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">Point your camera here</p>
                </div>
              )}
            </div>
          )}
          
          {/* No Frame */}
          {frameStyle === 'none' && <canvas ref={canvasRef} />}
        </div>
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