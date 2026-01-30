import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function QRCodeForm({ user, onGenerate, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'static',
    content_type: 'url',
    content: '',
    design_config: {
      foreground_color: '#000000',
      background_color: '#ffffff',
      logo_url: '',
      qr_style: 'squares',
      frame_style: 'none',
      frame_text: 'Scan Me',
      frame_color: '#000000'
    }
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const isPro = user?.subscription_tier === 'pro' && user?.subscription_status === 'active';

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDesignChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      design_config: { ...prev.design_config, [field]: value }
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      handleDesignChange('logo_url', data.file_url);
    } catch (error) {
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate short code for dynamic QR codes
    const shortCode = formData.type === 'dynamic' 
      ? Math.random().toString(36).substring(2, 10)
      : null;

    const qrCodeData = {
      ...formData,
      short_code: shortCode
    };

    onGenerate(qrCodeData);
  };

  const handleSaveQR = () => {
    if (!formData.name || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    const shortCode = formData.type === 'dynamic' 
      ? Math.random().toString(36).substring(2, 10)
      : null;

    onSave({
      ...formData,
      short_code: shortCode,
      scan_count: 0,
      is_active: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* QR Code Name */}
      <div>
        <Label htmlFor="name">QR Code Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Product Landing Page"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>

      {/* QR Code Type */}
      <div>
        <Label htmlFor="type">QR Code Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => handleChange('type', value)}
          disabled={!isPro}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">
              Static
            </SelectItem>
            <SelectItem value="dynamic" disabled={!isPro}>
              Dynamic {!isPro && '(Pro Only)'}
            </SelectItem>
          </SelectContent>
        </Select>
        {formData.type === 'dynamic' && (
          <p className="text-sm text-gray-600 mt-1">
            Dynamic QR codes can be edited after creation without changing the QR code image.
          </p>
        )}
        {!isPro && (
          <Alert className="mt-2">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Dynamic QR codes are available on Pro plans.{' '}
              <Link to="/Pricing" className="font-semibold underline">
                Upgrade now
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content Type */}
      <div>
        <Label htmlFor="content_type">Content Type</Label>
        <Select 
          value={formData.content_type} 
          onValueChange={(value) => handleChange('content_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL / Website</SelectItem>
            <SelectItem value="text">Plain Text</SelectItem>
            <SelectItem value="wifi">WiFi Credentials</SelectItem>
            <SelectItem value="vcard">vCard (Contact)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Input */}
      <div>
        <Label htmlFor="content">
          {formData.content_type === 'url' && 'URL *'}
          {formData.content_type === 'text' && 'Text Content *'}
          {formData.content_type === 'wifi' && 'WiFi Details *'}
          {formData.content_type === 'vcard' && 'vCard Data *'}
        </Label>
        {formData.content_type === 'url' && (
          <Input
            id="content"
            type="url"
            placeholder="https://example.com"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            required
          />
        )}
        {formData.content_type === 'text' && (
          <Textarea
            id="content"
            placeholder="Enter your text here..."
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={4}
            required
          />
        )}
        {formData.content_type === 'wifi' && (
          <Textarea
            id="content"
            placeholder="SSID:YourNetwork&#10;Password:YourPassword&#10;Encryption:WPA"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={3}
            required
          />
        )}
        {formData.content_type === 'vcard' && (
          <Textarea
            id="content"
            placeholder="Name:John Doe&#10;Phone:+1234567890&#10;Email:john@example.com&#10;Company:ACME Inc"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={5}
            required
          />
        )}
      </div>

      {/* Design Customization */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Design Customization</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="foreground">Foreground Color</Label>
            <div className="flex gap-2">
              <Input
                id="foreground"
                type="color"
                value={formData.design_config.foreground_color}
                onChange={(e) => handleDesignChange('foreground_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.design_config.foreground_color}
                onChange={(e) => handleDesignChange('foreground_color', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="background">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="background"
                type="color"
                value={formData.design_config.background_color}
                onChange={(e) => handleDesignChange('background_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.design_config.background_color}
                onChange={(e) => handleDesignChange('background_color', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Pro Features */}
        {isPro ? (
          <>
            {/* QR Style */}
            <div>
              <Label htmlFor="qr_style">QR Code Style</Label>
              <Select 
                value={formData.design_config.qr_style} 
                onValueChange={(value) => handleDesignChange('qr_style', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="squares">Squares (Classic)</SelectItem>
                  <SelectItem value="dots">Dots (Modern)</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frame Style */}
            <div>
              <Label htmlFor="frame_style">Frame Style</Label>
              <Select 
                value={formData.design_config.frame_style} 
                onValueChange={(value) => handleDesignChange('frame_style', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Frame</SelectItem>
                  <SelectItem value="basic">Basic Frame</SelectItem>
                  <SelectItem value="modern">Modern Frame</SelectItem>
                  <SelectItem value="badge">Badge Frame</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frame Text */}
            {formData.design_config.frame_style !== 'none' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frame_text">Frame Text</Label>
                  <Input
                    id="frame_text"
                    placeholder="e.g., Scan Me, Sign Up"
                    value={formData.design_config.frame_text}
                    onChange={(e) => handleDesignChange('frame_text', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="frame_color">Frame Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="frame_color"
                      type="color"
                      value={formData.design_config.frame_color}
                      onChange={(e) => handleDesignChange('frame_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.design_config.frame_color}
                      onChange={(e) => handleDesignChange('frame_color', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              {formData.design_config.logo_url ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={formData.design_config.logo_url} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain border rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDesignChange('logo_url', '')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo').click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-500">Max 2MB, PNG/JPG</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Advanced customization (styles, frames, logos) available on Pro.{' '}
              <Link to="/Pricing" className="font-semibold underline">
                Upgrade now
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="outline" className="flex-1">
          Generate Preview
        </Button>
        <Button 
          type="button" 
          onClick={handleSaveQR}
          disabled={saving || !formData.name || !formData.content}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save QR Code'}
        </Button>
      </div>
    </form>
  );
}