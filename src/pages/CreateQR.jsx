import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCodeForm from '../components/qr/QRCodeForm';
import QRCodePreview from '../components/qr/QRCodePreview';

export default function CreateQR() {
  const [user, setUser] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl('CreateQR'));
      }
    };
    fetchUser();
  }, []);

  const handleGenerate = (data) => {
    setQrData(data);
  };

  const handleSave = async (qrCodeData) => {
    setSaving(true);
    try {
      await base44.entities.QRCode.create(qrCodeData);
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create QR Code</h1>

        <div className="grid lg:grid-cols-2 gap-8">
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
              />
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodePreview qrData={qrData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}