import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Upload, X, Link2, Type, Wifi, User, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const CONTENT_TYPES = [
  { value: 'url', label: 'URL / Website', icon: Link2, desc: 'Link to any website or webpage' },
  { value: 'text', label: 'Plain Text', icon: Type, desc: 'Simple text message or information' },
  { value: 'wifi', label: 'WiFi Credentials', icon: Wifi, desc: 'Let people connect to your network' },
  { value: 'vcard', label: 'vCard Contact', icon: User, desc: 'Share your contact information' },
];

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function QRCodeForm({ user, onGenerate, onSave, saving }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
      frame_color: '#000000',
    },
  });

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDesignChange = (field, value) => {
    setFormData(prev => ({ ...prev, design_config: { ...prev.design_config, [field]: value } }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      handleDesignChange('logo_url', data.file_url);
    } catch {
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const goTo = (step) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
    // Update preview on every step change
    triggerPreview();
  };

  const triggerPreview = () => {
    const shortCode = formData.type === 'dynamic' ? Math.random().toString(36).substring(2, 10) : null;
    onGenerate({ ...formData, short_code: shortCode });
  };

  const handleSaveQR = () => {
    if (!formData.name || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }
    const shortCode = formData.type === 'dynamic' ? Math.random().toString(36).substring(2, 10) : null;
    onSave({ ...formData, short_code: shortCode, scan_count: 0, is_active: true });
  };

  const steps = ['Type', 'Content', 'Design'];

  const canProceedStep0 = !!formData.content_type;
  const canProceedStep1 = !!formData.name && !!formData.content;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-2">
        {steps.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < currentStep ? 'bg-blue-600 border-blue-600 text-white' :
                i === currentStep ? 'border-blue-600 text-blue-600 bg-white' :
                'border-gray-300 text-gray-400 bg-white'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === currentStep ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 0 && (
            <motion.div key="step0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-4">
              <p className="text-gray-600 text-sm">What type of content will this QR code contain?</p>
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map(({ value, label, icon: Icon, desc }) => (
                  <button key={value} type="button"
                    onClick={() => { handleChange('content_type', value); triggerPreview(); }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                      formData.content_type === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <Icon className={`w-5 h-5 ${formData.content_type === value ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-medium text-sm ${formData.content_type === value ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* QR Type (static/dynamic) */}
              <div className="pt-2">
                <Label>QR Code Behaviour</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button type="button" onClick={() => handleChange('type', 'static')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${formData.type === 'static' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`font-medium text-sm ${formData.type === 'static' ? 'text-blue-700' : 'text-gray-800'}`}>Static</p>
                    <p className="text-xs text-gray-500 mt-0.5">Fixed content, free forever</p>
                  </button>
                  <button type="button" onClick={() => isPro && handleChange('type', 'dynamic')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      !isPro ? 'opacity-50 cursor-not-allowed border-gray-200' :
                      formData.type === 'dynamic' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center gap-1">
                      <p className={`font-medium text-sm ${formData.type === 'dynamic' ? 'text-blue-700' : 'text-gray-800'}`}>Dynamic</p>
                      {!isPro && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Editable & trackable, Pro only</p>
                  </button>
                </div>
                {!isPro && (
                  <p className="text-xs text-gray-500 mt-2">
                    <Link to="/Pricing" className="text-blue-600 underline">Upgrade to Pro</Link> to unlock dynamic QR codes.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-4">
              <div>
                <Label htmlFor="name">QR Code Name *</Label>
                <Input id="name" placeholder="e.g., Product Landing Page" value={formData.name}
                  onChange={(e) => { handleChange('name', e.target.value); triggerPreview(); }} />
              </div>

              <div>
                <Label htmlFor="content">
                  {formData.content_type === 'url' && 'Destination URL *'}
                  {formData.content_type === 'text' && 'Text Content *'}
                  {formData.content_type === 'wifi' && 'WiFi Details *'}
                  {formData.content_type === 'vcard' && 'Contact Details *'}
                </Label>
                {formData.content_type === 'url' && (
                  <Input id="content" type="url" placeholder="https://example.com" value={formData.content}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview(); }} />
                )}
                {formData.content_type === 'text' && (
                  <Textarea id="content" placeholder="Enter your text here..." value={formData.content} rows={4}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview(); }} />
                )}
                {formData.content_type === 'wifi' && (
                  <Textarea id="content" placeholder={"SSID:YourNetwork\nPassword:YourPassword\nEncryption:WPA"} value={formData.content} rows={3}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview(); }} />
                )}
                {formData.content_type === 'vcard' && (
                  <Textarea id="content" placeholder={"Name:John Doe\nPhone:+1234567890\nEmail:john@example.com\nCompany:ACME Inc"} value={formData.content} rows={5}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview(); }} />
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Foreground Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" value={formData.design_config.foreground_color}
                      onChange={(e) => { handleDesignChange('foreground_color', e.target.value); triggerPreview(); }} className="w-14 h-10 p-1 cursor-pointer" />
                    <Input type="text" value={formData.design_config.foreground_color}
                      onChange={(e) => { handleDesignChange('foreground_color', e.target.value); triggerPreview(); }} placeholder="#000000" />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="background" type="color" value={formData.design_config.background_color}
                      onChange={(e) => { handleDesignChange('background_color', e.target.value); triggerPreview(); }} className="w-14 h-10 p-1 cursor-pointer" />
                    <Input type="text" value={formData.design_config.background_color}
                      onChange={(e) => { handleDesignChange('background_color', e.target.value); triggerPreview(); }} placeholder="#ffffff" />
                  </div>
                </div>
              </div>

              {isPro ? (
                <div className="space-y-4">
                  <div>
                    <Label>QR Code Style</Label>
                    <Select value={formData.design_config.qr_style} onValueChange={(v) => { handleDesignChange('qr_style', v); triggerPreview(); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="squares">Squares (Classic)</SelectItem>
                        <SelectItem value="dots">Dots (Modern)</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Frame Style</Label>
                    <Select value={formData.design_config.frame_style} onValueChange={(v) => { handleDesignChange('frame_style', v); triggerPreview(); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Frame</SelectItem>
                        <SelectItem value="basic">Basic Frame</SelectItem>
                        <SelectItem value="modern">Modern Frame</SelectItem>
                        <SelectItem value="badge">Badge Frame</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.design_config.frame_style !== 'none' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Frame Text</Label>
                        <Input className="mt-1" placeholder="Scan Me" value={formData.design_config.frame_text}
                          onChange={(e) => { handleDesignChange('frame_text', e.target.value); triggerPreview(); }} />
                      </div>
                      <div>
                        <Label>Frame Color</Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="color" value={formData.design_config.frame_color}
                            onChange={(e) => { handleDesignChange('frame_color', e.target.value); triggerPreview(); }} className="w-14 h-10 p-1 cursor-pointer" />
                          <Input type="text" value={formData.design_config.frame_color}
                            onChange={(e) => { handleDesignChange('frame_color', e.target.value); triggerPreview(); }} placeholder="#000000" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Company Logo</Label>
                    {formData.design_config.logo_url ? (
                      <div className="flex items-center gap-2 mt-1">
                        <img src={formData.design_config.logo_url} alt="Logo" className="w-14 h-14 object-contain border rounded" />
                        <Button type="button" variant="outline" size="sm" onClick={() => { handleDesignChange('logo_url', ''); triggerPreview(); }}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('logo').click()} disabled={uploadingLogo}>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-gray-500">Max 2MB, PNG/JPG</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Advanced styles, frames & logos are available on Pro.{' '}
                    <Link to="/Pricing" className="font-semibold underline">Upgrade now</Link>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2 border-t">
        {currentStep > 0 && (
          <Button type="button" variant="outline" onClick={() => goTo(currentStep - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {currentStep < 2 ? (
          <Button type="button" onClick={() => goTo(currentStep + 1)}
            disabled={currentStep === 0 ? !canProceedStep0 : !canProceedStep1}
            className="flex-1 bg-blue-600 hover:bg-blue-700">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSaveQR}
            disabled={saving || !formData.name || !formData.content}
            className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save QR Code'}
          </Button>
        )}
      </div>
    </div>
  );
}