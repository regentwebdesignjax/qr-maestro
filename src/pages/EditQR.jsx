import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Info } from 'lucide-react';
import QRCodePreview from '../components/qr/QRCodePreview';
import QRCodeForm from '../components/qr/QRCodeForm';

export default function EditQR() {
  const [qrCode, setQrCode] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [currentStep, setCurrentStep] = useState(2);

  useEffect(() => {
    const fetchQRCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (!id) { window.location.href = '/Dashboard'; return; }
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const qrCodes = await base44.entities.QRCode.filter({ id, created_by: currentUser.email });
        if (qrCodes.length === 0 || qrCodes[0].type !== 'dynamic') { window.location.href = '/Dashboard'; return; }
        const qr = qrCodes[0];
        setQrCode(qr);

        // Parse existing content back into form fields
        let vcard_data = {};
        let social_data = {};
        let wifi_data = { ssid: '', password: '', encryption: 'WPA' };
        let bcData = {};

        if (qr.content_type === 'vcard') {
          const lines = (qr.content || '').split('\n');
          vcard_data = {
            name: lines.find(l => l.startsWith('FN:'))?.split(':')[1]?.trim() || '',
            phone: lines.find(l => l.startsWith('TEL'))?.split(':')[1]?.trim() || '',
            email: lines.find(l => l.startsWith('EMAIL:'))?.split(':')[1]?.trim() || '',
            company: lines.find(l => l.startsWith('ORG:'))?.split(':')[1]?.trim() || '',
            url: lines.find(l => l.startsWith('URL:'))?.split(':')[1]?.trim() || '',
          };
        } else if (qr.content_type === 'wifi') {
          const ssid = qr.content.match(/S:([^;]+)/)?.[1] || '';
          const pwd = qr.content.match(/P:([^;]+)/)?.[1] || '';
          const enc = qr.content.match(/T:([^;]+)/)?.[1] || 'WPA';
          wifi_data = { ssid, password: pwd, encryption: enc };
        } else if (qr.content_type === 'social') {
          const lines = (qr.content || '').split('\n');
          lines.forEach(line => {
            const [platform, url] = line.split(':');
            if (platform && url) {
              if (platform.startsWith('custom_')) {
                // Custom platform - handled in QRCodeForm
              } else {
                social_data[platform] = url;
              }
            }
          });
        } else if (qr.content_type === 'business_card') {
          try {
            bcData = JSON.parse(qr.content || '{}');
          } catch {}
        }

        // Build design config with defaults
        const dc = {
          foreground_color: '#000000',
          background_color: '#ffffff',
          gradient_type: 'none',
          gradient_color2: '#6366f1',
          eye_outer_shape: 'square',
          eye_inner_shape: 'square',
          eye_color: '',
          logo_url: '',
          qr_style: 'squares',
          landing_header_image: '',
          landing_brand_logo: '',
          landing_theme_color: '#BB3F27',
          landing_font: 'poppins',
          lead_tag: '',
          cta_button_color: '#BB3F27',
          ...qr.design_config,
        };

        setPreviewData({
          ...qr,
          design_config: dc,
          vcard_data,
          social_data,
          wifi_data,
          bcData,
        });
      } catch (error) {
        console.error('Error fetching QR code:', error);
        window.location.href = '/Dashboard';
      } finally {
        setLoading(false);
      }
    };
    fetchQRCode();
  }, []);

  const handleGeneratePreview = (data) => {
    setPreviewData(prev => ({ ...prev, ...data }));
  };

  const handleSaveQR = async (formData) => {
    setSaving(true);
    try {
      await base44.entities.QRCode.update(qrCode.id, {
        name: formData.name,
        content: formData.content,
        content_type: formData.content_type,
        design_config: formData.design_config,
      });
      window.location.href = '/ViewQR?id=' + qrCode.id;
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to update QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  if (!qrCode || !previewData) return null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link to={'/ViewQR?id=' + qrCode.id}>
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit QR Code</h1>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Form */}
          <div>
            <Card>
              <CardHeader><CardTitle>Edit Configuration</CardTitle></CardHeader>
              <CardContent>
                <QRCodeForm
                  user={user}
                  onGenerate={handleGeneratePreview}
                  onSave={handleSaveQR}
                  saving={saving}
                  onStepChange={setCurrentStep}
                  initialData={{
                    name: qrCode.name,
                    type: qrCode.type,
                    content_type: qrCode.content_type,
                    content: qrCode.content,
                    design_config: previewData.design_config,
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
              <CardContent>
                <QRCodePreview qrData={previewData} currentStep={currentStep} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}