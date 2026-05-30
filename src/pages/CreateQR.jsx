import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/Container';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCodeForm from '../components/qr/QRCodeForm';
import QRCodePreview from '../components/qr/QRCodePreview';

export default function CreateQR() {
  const [user, setUser] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [customDomainBase, setCustomDomainBase] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Fetch active custom domain so the live preview uses the correct URL
        const res = await base44.functions.invoke('checkDomainStatus', {}).catch((err) => {
          console.error('[CreateQR] checkDomainStatus error:', err);
          return null;
        });
        console.log('[CreateQR] checkDomainStatus response:', res);
        const domain = res?.data?.customDomain;
        console.log('[CreateQR] extracted domain:', domain);
        if (domain?.status === 'active' && domain?.hostname) {
          const baseUrl = `https://${domain.hostname}`;
          console.log('[CreateQR] setting customDomainBase to:', baseUrl);
          setCustomDomainBase(baseUrl);
        } else {
          console.log('[CreateQR] domain not active or missing hostname - status:', domain?.status, 'hostname:', domain?.hostname);
        }
      } catch (error) {
        base44.auth.redirectToLogin('/CreateQR');
      }
    };
    fetchUser();
  }, []);

  // When customDomainBase becomes available, regenerate the preview if we have qrData
  // This ensures the QR encodes the custom domain even if customDomainBase loads after form interaction
  useEffect(() => {
    if (customDomainBase && qrData) {
      console.log('[CreateQR] customDomainBase changed, re-triggering preview with custom domain');
      handleGenerate(qrData);
    }
  }, [customDomainBase]);

  const handleGenerate = (data) => {
    console.log('[CreateQR] handleGenerate called', {
      isDynamic: data.type === 'dynamic',
      hasCustomDomain: !!customDomainBase,
      customDomainBase,
      dataType: data.type,
      shortCode: data.short_code
    });

    // For dynamic QRs with an active custom domain, inject the domain into preview
    // This ensures the QR image encodes the custom domain URL in the yellow camera badge
    const previewData = { ...data };
    if (customDomainBase && data.type === 'dynamic') {
      previewData.redirect_base_url = customDomainBase;
      console.log('[CreateQR] handleGenerate - INJECTED custom domain into preview:', {
        url: `${customDomainBase}/${data.short_code}`,
        redirect_base_url: customDomainBase
      });
    } else {
      console.log('[CreateQR] handleGenerate - NOT injecting:', {
        reason: customDomainBase ? 'not dynamic' : 'no custom domain',
        isDynamic: data.type === 'dynamic'
      });
    }
    setQrData(previewData);
  };

  const handleSave = async (qrCodeData) => {
    setSaving(true);
    try {
      // Inject redirect_base_url from state if user has an active custom domain
      console.log('[CreateQR] handleSave - customDomainBase:', customDomainBase, 'type:', qrCodeData.type);
      if (customDomainBase && qrCodeData.type === 'dynamic') {
        qrCodeData.redirect_base_url = customDomainBase;
        console.log('[CreateQR] handleSave - injected redirect_base_url:', qrCodeData.redirect_base_url);
      }
      console.log('[CreateQR] handleSave - final qrCodeData.redirect_base_url:', qrCodeData.redirect_base_url);
      console.log('[CreateQR] handleSave - full payload:', JSON.stringify(qrCodeData, null, 2));
      const response = await base44.functions.invoke('createQRCode', qrCodeData);
      console.log('[CreateQR] handleSave - response from createQRCode:', response);
      console.log('[CreateQR] handleSave - saved QR code details:', {
        id: response?.data?.qrCode?.id,
        short_code: response?.data?.qrCode?.short_code,
        is_active: response?.data?.qrCode?.is_active,
        redirect_base_url: response?.data?.qrCode?.redirect_base_url,
      });
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      window.location.href = '/Dashboard';
    } catch (error) {
      console.error('Error saving QR code:', error);
      const msg = error?.response?.data?.error || error?.message || '';
      alert(msg || 'Failed to save QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <Container>
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create QR Code</h1>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden h-10 gap-2"
            onClick={() => setShowMobilePreview(v => !v)}
          >
            {showMobilePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showMobilePreview ? 'Hide Preview' : 'Preview'}
          </Button>
        </div>

        {/* Mobile Preview Panel */}
        {showMobilePreview && (
          <Card className="md:hidden mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodePreview qrData={qrData} currentStep={currentStep} customDomainBase={customDomainBase} />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Details</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeForm
                user={user}
                onGenerate={handleGenerate}
                onSave={handleSave}
                saving={saving}
                onStepChange={setCurrentStep}
              />
            </CardContent>
          </Card>

          {/* Sticky Preview Section — desktop only */}
          <div className="hidden lg:block lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodePreview qrData={qrData} currentStep={currentStep} customDomainBase={customDomainBase} />
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
