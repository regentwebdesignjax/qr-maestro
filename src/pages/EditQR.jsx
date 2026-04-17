import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Info, Upload, X } from 'lucide-react';
import QRCodePreview from '../components/qr/QRCodePreview';

function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

function ColorInput({ value, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return (
    <div className="flex gap-2 mt-1">
      <Input type="color" value={value} onChange={(e) => { setText(e.target.value); onChange(e.target.value); }} className="w-14 h-10 p-1 cursor-pointer" />
      <Input type="text" value={text} maxLength={7} placeholder="#000000"
        onChange={(e) => { setText(e.target.value); if (isValidHex(e.target.value)) onChange(e.target.value); }} />
    </div>
  );
}

export default function EditQR() {
  const [qrCode, setQrCode] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [designConfig, setDesignConfig] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setFormData({ name: qr.name, content: qr.content });
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
          ...qr.design_config,
        };
        setDesignConfig(dc);
        setPreviewData({ ...qr, design_config: dc });
      } catch (error) {
        console.error('Error fetching QR code:', error);
        window.location.href = '/Dashboard';
      } finally {
        setLoading(false);
      }
    };
    fetchQRCode();
  }, []);

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  const updateDesign = (field, value) => {
    setDesignConfig(prev => {
      const next = { ...prev, [field]: value };
      setPreviewData(pd => ({ ...pd, design_config: next }));
      return next;
    });
  };

  const updateContent = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      setPreviewData(pd => ({ ...pd, [field]: value }));
      return next;
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const logoUrl = result?.file_url || result?.data?.file_url;
      if (logoUrl) updateDesign('logo_url', logoUrl);
    } catch (err) {
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.QRCode.update(qrCode.id, {
        name: formData.name,
        content: formData.content,
        design_config: designConfig,
      });
      window.location.href = '/ViewQR?id=' + qrCode.id;
    } catch (error) {
      alert('Failed to update QR code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const EyeBtn = ({ field, value, label, children }) => (
    <button type="button" onClick={() => updateDesign(field, value)}
      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${designConfig[field] === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className={`w-7 h-7 flex items-center justify-center ${designConfig[field] === value ? 'text-primary' : 'text-gray-500'}`}>{children}</div>
      <span className={`text-xs font-medium ${designConfig[field] === value ? 'text-primary' : 'text-gray-600'}`}>{label}</span>
    </button>
  );

  const StyleBtn = ({ value, label }) => (
    <button type="button" onClick={() => updateDesign('qr_style', value)}
      className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${designConfig.qr_style === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
      {label}
    </button>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to={'/ViewQR?id=' + qrCode.id}>
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit QR Code</h1>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Updating the URL redirects all existing scans — the QR image stays the same.</AlertDescription>
                </Alert>
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => updateContent('name', e.target.value)} />
                </div>
                <div>
                  <Label>
                    {qrCode.content_type === 'url' ? 'Destination URL' :
                     qrCode.content_type === 'text' ? 'Text Content' :
                     qrCode.content_type === 'wifi' ? 'WiFi Details' : 'vCard Data'}
                  </Label>
                  {qrCode.content_type === 'url' ? (
                    <Input type="url" value={formData.content} onChange={(e) => updateContent('content', e.target.value)} />
                  ) : (
                    <Textarea value={formData.content} onChange={(e) => updateContent('content', e.target.value)} rows={4} />
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Short URL</p>
                  <p className="font-mono text-sm break-all">{window.location.origin}/r?code={qrCode.short_code}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Design</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <ColorInput value={designConfig.background_color || '#ffffff'} onChange={(v) => updateDesign('background_color', v)} />
                </div>

                <div className="border rounded-xl p-4 space-y-3">
                  <Label className="font-semibold">Foreground Color</Label>
                  <div>
                    <Label className="text-xs text-gray-500">Color Mode</Label>
                    <Select value={designConfig.gradient_type || 'none'} onValueChange={(v) => updateDesign('gradient_type', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Solid Color</SelectItem>
                        <SelectItem value="linear">Linear Gradient</SelectItem>
                        <SelectItem value="radial">Radial Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={`grid gap-4 ${designConfig.gradient_type !== 'none' ? 'grid-cols-2' : ''}`}>
                    <div>
                      <Label className="text-xs text-gray-500">{designConfig.gradient_type !== 'none' ? 'Color 1' : 'Color'}</Label>
                      <ColorInput value={designConfig.foreground_color || '#000000'} onChange={(v) => updateDesign('foreground_color', v)} />
                    </div>
                    {designConfig.gradient_type !== 'none' && (
                      <div>
                        <Label className="text-xs text-gray-500">Color 2</Label>
                        <ColorInput value={designConfig.gradient_color2 || '#6366f1'} onChange={(v) => updateDesign('gradient_color2', v)} />
                      </div>
                    )}
                  </div>
                </div>

                {isPro && (
                  <>
                    <div>
                      <Label className="mb-2 block">QR Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <StyleBtn value="squares" label="Squares" />
                        <StyleBtn value="dots" label="Dots" />
                        <StyleBtn value="rounded" label="Rounded" />
                      </div>
                    </div>

                    <div className="border rounded-xl p-4 space-y-3">
                      <Label className="font-semibold">Eye (Finder) Style</Label>
                      <div>
                        <Label className="text-xs text-gray-500 mb-2 block">Outer Shape</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <EyeBtn field="eye_outer_shape" value="square" label="Square">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7"><rect x="3" y="3" width="18" height="18" rx="0" /><rect x="7" y="7" width="10" height="10" rx="0" fill="currentColor" fillOpacity="0.2" /></svg>
                          </EyeBtn>
                          <EyeBtn field="eye_outer_shape" value="circle" label="Circle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" /></svg>
                          </EyeBtn>
                          <EyeBtn field="eye_outer_shape" value="rounded" label="Rounded">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7"><rect x="3" y="3" width="18" height="18" rx="6" /><rect x="7" y="7" width="10" height="10" rx="3" fill="currentColor" fillOpacity="0.2" /></svg>
                          </EyeBtn>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-2 block">Inner Shape</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <EyeBtn field="eye_inner_shape" value="square" label="Square">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><rect x="6" y="6" width="12" height="12" /></svg>
                          </EyeBtn>
                          <EyeBtn field="eye_inner_shape" value="circle" label="Circle">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="12" cy="12" r="6" /></svg>
                          </EyeBtn>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Eye Color <span className="text-gray-400">(blank = foreground)</span></Label>
                        <div className="flex gap-2 mt-1 items-center">
                          <Input type="color" value={designConfig.eye_color || designConfig.foreground_color || '#000000'}
                            onChange={(e) => updateDesign('eye_color', e.target.value)} className="w-14 h-10 p-1 cursor-pointer" />
                          <Input type="text" value={designConfig.eye_color || ''} placeholder="Same as foreground" maxLength={7}
                            onChange={(e) => { if (isValidHex(e.target.value) || e.target.value === '') updateDesign('eye_color', e.target.value); }} />
                          {designConfig.eye_color && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => updateDesign('eye_color', '')}><X className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Logo</Label>
                      {designConfig.logo_url ? (
                        <div className="flex items-center gap-2 mt-1">
                          <img src={designConfig.logo_url} alt="Logo" className="w-14 h-14 object-contain border rounded" />
                          <Button type="button" variant="outline" size="sm" onClick={() => updateDesign('logo_url', '')}>
                            <X className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Input id="logo-edit" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                          <Button type="button" variant="outline" onClick={() => document.getElementById('logo-edit').click()} disabled={uploadingLogo}>
                            <Upload className="w-4 h-4 mr-2" />{uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Link to={'/ViewQR?id=' + qrCode.id} className="flex-1">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving || !formData.name || !formData.content} className="flex-1">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
              <CardContent>
                <QRCodePreview qrData={previewData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}