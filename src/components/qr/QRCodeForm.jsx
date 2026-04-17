import React, { useState, useCallback, useEffect } from 'react';
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

// Only fires preview when hex text is a valid full color
function isValidHex(v) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

function ColorInput({ value, onChange, onPreview }) {
  const [textVal, setTextVal] = useState(value);

  // Keep local text in sync when parent value changes (e.g. color picker)
  React.useEffect(() => { setTextVal(value); }, [value]);

  const handleTextChange = (e) => {
    const v = e.target.value;
    setTextVal(v);
    if (isValidHex(v)) {
      onChange(v);
      onPreview && onPreview(v);
    }
  };

  const handleColorPickerChange = (e) => {
    const v = e.target.value;
    setTextVal(v);
    onChange(v);
    onPreview && onPreview(v);
  };

  return (
    <div className="flex gap-2 mt-1">
      <Input type="color" value={value} onChange={handleColorPickerChange} className="w-14 h-10 p-1 cursor-pointer" />
      <Input type="text" value={textVal} onChange={handleTextChange} placeholder="#000000" maxLength={7} />
    </div>
  );
}

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
      gradient_type: 'none',
      gradient_color2: '#6366f1',
      eye_outer_shape: 'square',
      eye_inner_shape: 'square',
      eye_color: '',
      logo_url: '',
      qr_style: 'squares',
    },
  });

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleDesignChange = (field, value) => {
    setFormData(prev => ({ ...prev, design_config: { ...prev.design_config, [field]: value } }));
  };

  // Generate preview with an optional override to avoid stale state
  const triggerPreview = useCallback((overrides = {}) => {
    setFormData(prev => {
      const merged = {
        ...prev,
        ...overrides,
        design_config: { ...prev.design_config, ...(overrides.design_config || {}) },
      };
      const shortCode = merged.type === 'dynamic' ? Math.random().toString(36).substring(2, 10) : null;
      onGenerate({ ...merged, short_code: shortCode });
      return prev; // don't actually change state here
    });
  }, [onGenerate]);

  // For design fields: update state AND fire preview with the new value immediately
  const handleDesignChangeAndPreview = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, design_config: { ...prev.design_config, [field]: value } };
      const shortCode = next.type === 'dynamic' ? Math.random().toString(36).substring(2, 10) : null;
      onGenerate({ ...next, short_code: shortCode });
      return next;
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      // result is the response directly: { file_url: "..." }
      const logoUrl = result?.file_url || result?.data?.file_url;
      if (logoUrl) {
        handleDesignChangeAndPreview('logo_url', logoUrl);
      } else {
        alert('Upload succeeded but no URL was returned. Please try again.');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Failed to upload logo. Please ensure the file is under 2MB and is a valid image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const goTo = (step) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
    triggerPreview();
  };

  const handleSaveQR = () => {
    if (!formData.name || !formData.content) { alert('Please fill in all required fields'); return; }
    const shortCode = formData.type === 'dynamic' ? Math.random().toString(36).substring(2, 10) : null;
    onSave({ ...formData, short_code: shortCode, scan_count: 0, is_active: true });
  };

  const steps = ['Type', 'Content', 'Design'];
  const canProceedStep0 = !!formData.content_type;
  const canProceedStep1 = !!formData.name && !!formData.content;
  const dc = formData.design_config;

  const EyeShapeButton = ({ field, value, label, children }) => (
    <button type="button"
      onClick={() => handleDesignChangeAndPreview(field, value)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
        dc[field] === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
      }`}>
      <div className={`w-8 h-8 flex items-center justify-center ${dc[field] === value ? 'text-primary' : 'text-gray-500'}`}>
        {children}
      </div>
      <span className={`text-xs font-medium ${dc[field] === value ? 'text-primary' : 'text-gray-600'}`}>{label}</span>
    </button>
  );

  const QRStyleButton = ({ value, label }) => (
    <button type="button"
      onClick={() => handleDesignChangeAndPreview('qr_style', value)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
        dc.qr_style === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
      }`}>
      <span className={`text-sm font-medium ${dc.qr_style === value ? 'text-primary' : 'text-gray-600'}`}>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-2">
        {steps.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < currentStep ? 'bg-primary border-primary text-white' :
                i === currentStep ? 'border-primary text-primary bg-white' :
                'border-gray-300 text-gray-400 bg-white'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === currentStep ? 'text-primary' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>

          {/* Step 0: Type */}
          {currentStep === 0 && (
            <motion.div key="step0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-4">
              <p className="text-gray-600 text-sm">What type of content will this QR code contain?</p>
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map(({ value, label, icon: Icon, desc }) => {
                  const isUrlOnly = value !== 'url';
                  const isDisabled = formData.type === 'static' && isUrlOnly;
                  
                  return (
                    <button key={value} type="button"
                      onClick={() => { if (!isDisabled) { handleChange('content_type', value); triggerPreview({ content_type: value }); } }}
                      disabled={isDisabled}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : formData.content_type === value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <Icon className={`w-5 h-5 ${isDisabled ? 'text-gray-400' : formData.content_type === value ? 'text-primary' : 'text-gray-500'}`} />
                      <div>
                        <p className={`font-medium text-sm ${isDisabled ? 'text-gray-500' : formData.content_type === value ? 'text-primary' : 'text-gray-800'}`}>{label}</p>
                        <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                          {isDisabled ? 'Dynamic only' : desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2">
                <Label>QR Code Behaviour</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {formData.content_type !== 'url' ? (
                    <button type="button" disabled className={`p-3 rounded-xl border-2 text-left opacity-50 cursor-not-allowed border-gray-200 bg-gray-50`}>
                      <p className="font-medium text-sm text-gray-500">Static</p>
                      <p className="text-xs text-gray-400 mt-0.5">URL only</p>
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleChange('type', 'static')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${formData.type === 'static' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className={`font-medium text-sm ${formData.type === 'static' ? 'text-primary' : 'text-gray-800'}`}>Static</p>
                      <p className="text-xs text-gray-500 mt-0.5">Fixed content, free forever</p>
                    </button>
                  )}
                  <button type="button" onClick={() => isPro && handleChange('type', 'dynamic')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      !isPro ? 'opacity-50 cursor-not-allowed border-gray-200' :
                      formData.type === 'dynamic' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center gap-1">
                      <p className={`font-medium text-sm ${formData.type === 'dynamic' ? 'text-primary' : 'text-gray-800'}`}>Dynamic</p>
                      {!isPro && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Editable & trackable, Pro only</p>
                  </button>
                </div>
                {!isPro && (
                  <p className="text-xs text-gray-500 mt-2">
                    <Link to="/Pricing" className="text-primary underline">Upgrade to Pro</Link> to unlock dynamic QR codes.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 1: Content */}
          {currentStep === 1 && (
            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-4">
              <div>
                <Label htmlFor="name">QR Code Name *</Label>
                <Input id="name" placeholder="e.g., Product Landing Page" value={formData.name}
                  onChange={(e) => { handleChange('name', e.target.value); triggerPreview({ name: e.target.value }); }} />
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
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview({ content: e.target.value }); }} />
                )}
                {formData.content_type === 'text' && (
                  <Textarea id="content" placeholder="Enter your text here..." value={formData.content} rows={4}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview({ content: e.target.value }); }} />
                )}
                {formData.content_type === 'wifi' && (
                  <Textarea id="content" placeholder={"SSID:YourNetwork\nPassword:YourPassword\nEncryption:WPA"} value={formData.content} rows={3}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview({ content: e.target.value }); }} />
                )}
                {formData.content_type === 'vcard' && (
                  <Textarea id="content" placeholder={"Name:John Doe\nPhone:+1234567890\nEmail:john@example.com\nCompany:ACME Inc"} value={formData.content} rows={5}
                    onChange={(e) => { handleChange('content', e.target.value); triggerPreview({ content: e.target.value }); }} />
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Design */}
          {currentStep === 2 && (
            <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }} className="space-y-5">

              {/* Background */}
              <div>
                <Label>Background Color</Label>
                <ColorInput
                  value={dc.background_color}
                  onChange={(v) => handleDesignChange('background_color', v)}
                  onPreview={(v) => handleDesignChangeAndPreview('background_color', v)}
                />
              </div>

              {/* Foreground / Gradient */}
              <div className="space-y-3 border rounded-xl p-4">
                <Label className="font-semibold">Foreground / Pattern Color</Label>
                <div>
                  <Label className="text-xs text-gray-500">Color Mode</Label>
                  <Select value={dc.gradient_type} onValueChange={(v) => handleDesignChangeAndPreview('gradient_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Solid Color</SelectItem>
                      <SelectItem value="linear">Linear Gradient</SelectItem>
                      <SelectItem value="radial">Radial Gradient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={`grid gap-4 ${dc.gradient_type !== 'none' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <Label className="text-xs text-gray-500">{dc.gradient_type !== 'none' ? 'Color 1 (Start)' : 'Color'}</Label>
                    <ColorInput
                      value={dc.foreground_color}
                      onChange={(v) => handleDesignChange('foreground_color', v)}
                      onPreview={(v) => handleDesignChangeAndPreview('foreground_color', v)}
                    />
                  </div>
                  {dc.gradient_type !== 'none' && (
                    <div>
                      <Label className="text-xs text-gray-500">Color 2 (End)</Label>
                      <ColorInput
                        value={dc.gradient_color2}
                        onChange={(v) => handleDesignChange('gradient_color2', v)}
                        onPreview={(v) => handleDesignChangeAndPreview('gradient_color2', v)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {isPro ? (
                <div className="space-y-5">
                  {/* QR Style */}
                  <div>
                    <Label className="mb-2 block">QR Code Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <QRStyleButton value="squares" label="Squares" />
                      <QRStyleButton value="dots" label="Dots" />
                      <QRStyleButton value="rounded" label="Rounded" />
                    </div>
                  </div>

                  {/* Eye Shape */}
                  <div className="space-y-3 border rounded-xl p-4">
                    <Label className="font-semibold">Eye (Finder) Style</Label>

                    <div>
                      <Label className="text-xs text-gray-500 mb-2 block">Outer Eye Shape</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <EyeShapeButton field="eye_outer_shape" value="square" label="Square">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                            <rect x="3" y="3" width="18" height="18" rx="0" />
                            <rect x="7" y="7" width="10" height="10" rx="0" fill="currentColor" fillOpacity="0.2" />
                          </svg>
                        </EyeShapeButton>
                        <EyeShapeButton field="eye_outer_shape" value="circle" label="Circle">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
                          </svg>
                        </EyeShapeButton>
                        <EyeShapeButton field="eye_outer_shape" value="rounded" label="Rounded">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                            <rect x="3" y="3" width="18" height="18" rx="6" />
                            <rect x="7" y="7" width="10" height="10" rx="3" fill="currentColor" fillOpacity="0.2" />
                          </svg>
                        </EyeShapeButton>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-2 block">Inner Eye Shape</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <EyeShapeButton field="eye_inner_shape" value="square" label="Square">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <rect x="6" y="6" width="12" height="12" rx="0" />
                          </svg>
                        </EyeShapeButton>
                        <EyeShapeButton field="eye_inner_shape" value="circle" label="Circle">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <circle cx="12" cy="12" r="6" />
                          </svg>
                        </EyeShapeButton>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Eye Color <span className="text-gray-400">(leave blank to use foreground color)</span></Label>
                      <div className="flex gap-2 mt-1 items-center">
                        <Input type="color" value={dc.eye_color || dc.foreground_color}
                          onChange={(e) => handleDesignChangeAndPreview('eye_color', e.target.value)}
                          className="w-14 h-10 p-1 cursor-pointer" />
                        <Input type="text" value={dc.eye_color}
                          onChange={(e) => {
                            handleDesignChange('eye_color', e.target.value);
                            if (isValidHex(e.target.value)) handleDesignChangeAndPreview('eye_color', e.target.value);
                          }}
                          placeholder="Same as foreground" maxLength={7} />
                        {dc.eye_color && (
                          <Button type="button" variant="ghost" size="icon" className="shrink-0"
                            onClick={() => handleDesignChangeAndPreview('eye_color', '')}>
                            <X className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <Label>Company Logo</Label>
                    {dc.logo_url ? (
                      <div className="flex items-center gap-2 mt-1">
                        <img src={dc.logo_url} alt="Logo" className="w-14 h-14 object-contain border rounded" />
                        <Button type="button" variant="outline" size="sm" onClick={() => handleDesignChangeAndPreview('logo_url', '')}>
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
                    Advanced styles, gradients, custom eyes, frames & logos are available on Pro.{' '}
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
            className="flex-1">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSaveQR}
            disabled={saving || !formData.name || !formData.content}
            className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save QR Code'}
          </Button>
        )}
      </div>
    </div>
  );
}