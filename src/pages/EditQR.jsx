import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function EditQR() {
  const [qrCode, setQrCode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        window.location.href = '/Dashboard';
        return;
      }

      try {
        const user = await base44.auth.me();
        const qrCodes = await base44.entities.QRCode.filter({ id, created_by: user.email });
        
        if (qrCodes.length === 0 || qrCodes[0].type !== 'dynamic') {
          window.location.href = '/Dashboard';
          return;
        }

        const qr = qrCodes[0];
        setQrCode(qr);
        setFormData({
          name: qr.name,
          content: qr.content
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.QRCode.update(qrCode.id, {
        name: formData.name,
        content: formData.content,
      });
      alert('QR code updated successfully!');
      window.location.href = '/Dashboard';
    } catch (error) {
      console.error('Error updating QR code:', error);
      alert('Failed to update QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Dynamic QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can update the destination URL without changing the QR code image. 
                Anyone who scans the original QR code will be redirected to the new URL.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="name">QR Code Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="content">
                {qrCode.content_type === 'url' && 'Destination URL'}
                {qrCode.content_type === 'text' && 'Text Content'}
                {qrCode.content_type === 'wifi' && 'WiFi Details'}
                {qrCode.content_type === 'vcard' && 'vCard Data'}
              </Label>
              {qrCode.content_type === 'url' ? (
                <Input
                  id="content"
                  type="url"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              ) : (
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                />
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Short URL (unchangeable)</p>
              <p className="font-mono text-sm break-all">
                {window.location.origin}/_functions/redirect?code={qrCode.short_code}
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/Dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button 
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.content}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}