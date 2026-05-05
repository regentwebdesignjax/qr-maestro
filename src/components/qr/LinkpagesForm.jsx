import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 })
};

function ColorInput({ value, onChange }) {
  const [textVal, setTextVal] = useState(value);

  React.useEffect(() => { setTextVal(value); }, [value]);

  const handleTextChange = (e) => {
    const v = e.target.value;
    setTextVal(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    }
  };

  const handleColorPickerChange = (e) => {
    const v = e.target.value;
    setTextVal(v);
    onChange(v);
  };

  return (
    <div className="flex gap-2 mt-1">
      <Input type="color" value={value} onChange={handleColorPickerChange} className="w-14 h-10 p-1 cursor-pointer" />
      <Input type="text" value={textVal} onChange={handleTextChange} placeholder="#000000" maxLength={7} />
    </div>
  );
}

export default function LinkpagesForm({ data, onChange, currentStep, onStepChange }) {
  const [direction, setDirection] = useState(1);
  const stepValue = currentStep !== undefined ? currentStep : 0;

  const navigateStep = (newStep) => {
    setDirection(newStep > stepValue ? 1 : -1);
    onStepChange?.(newStep);
  };
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingBackgroundImage, setUploadingBackgroundImage] = useState(false);

  const formData = data || {
    profile_image: '',
    title: '',
    description: '',
    links: [{ button_text: '', button_url: '' }],
    design: {
      background_type: 'solid',
      background_color: '#ffffff',
      background_image: '',
      gradient_start: '#2f3f7f',
      gradient_end: '#ffffff',
      overlay_color: '#000000',
      overlay_opacity: 0,
      background_opacity: 1,
      background_saturation: 100,
      font_family: 'open_sans',
      title_color: '#000000',
      description_color: '#666666',
      button_style: 'rounded',
      button_color: '#2f3f7f',
      button_text_color: '#ffffff'
    },
    custom_slug: '',
    browser_title: ''
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(formData));
    let obj = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  const handleLinkChange = (idx, field, value) => {
    const newLinks = [...formData.links];
    newLinks[idx] = { ...newLinks[idx], [field]: value };
    handleChange('links', newLinks);
  };

  const handleAddLink = () => {
    const newLinks = [...formData.links, { button_text: '', button_url: '' }];
    handleChange('links', newLinks);
  };

  const handleRemoveLink = (idx) => {
    const newLinks = formData.links.filter((_, i) => i !== idx);
    handleChange('links', newLinks);
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfilePic(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const imageUrl = result?.file_url || result?.data?.file_url;
      if (imageUrl) {
        handleChange('profile_image', imageUrl);
      } else {
        alert('Upload succeeded but no URL was returned. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please ensure the file is under 2MB and is a valid image.');
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleBackgroundImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBackgroundImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const imageUrl = result?.file_url || result?.data?.file_url;
      if (imageUrl) {
        handleChange('design.background_image', imageUrl);
      } else {
        alert('Upload succeeded but no URL was returned. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please ensure the file is under 5MB and is a valid image.');
    } finally {
      setUploadingBackgroundImage(false);
    }
  };

  const steps = ['Content', 'Design', 'Setup'];

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <button
              type="button"
              onClick={() => navigateStep(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                i <= currentStep
                  ? i === stepValue
                    ? 'bg-primary text-white'
                    : 'bg-primary/20 text-primary'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {step}
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < stepValue ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="overflow-hidden min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>

          {/* Step 0: Content */}
          {stepValue === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >
              <div>
                <Label>Profile Image</Label>
                {formData.profile_image ? (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={formData.profile_image} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleChange('profile_image', '')}
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={uploadingProfilePic}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profile-image').click()}
                      disabled={uploadingProfilePic}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingProfilePic ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <p className="text-xs text-gray-500">Max 2MB, PNG/JPG</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="linkpage-title">Title *</Label>
                <Input
                  id="linkpage-title"
                  placeholder="e.g., Stark Industries"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="linkpage-description">Description</Label>
                <Textarea
                  id="linkpage-description"
                  placeholder="e.g., Changing the world for a better future"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium">Links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLink}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Link
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.links.map((link, idx) => (
                    <div key={idx} className="space-y-2 p-3 border rounded-lg">
                      <div>
                        <Label className="text-xs text-gray-600">Button Text</Label>
                        <Input
                          placeholder="e.g., Visit Website"
                          value={link.button_text}
                          onChange={(e) => handleLinkChange(idx, 'button_text', e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">Button URL</Label>
                          <Input
                            placeholder="https://..."
                            value={link.button_url}
                            onChange={(e) => handleLinkChange(idx, 'button_url', e.target.value)}
                          />
                        </div>
                        {formData.links.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6"
                            onClick={() => handleRemoveLink(idx)}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Design */}
          {stepValue === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {/* Background */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-medium">Background</Label>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Type</Label>
                  <Select value={formData.design.background_type} onValueChange={(v) => handleChange('design.background_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.design.background_type === 'solid' && (
                  <div>
                    <Label className="text-xs text-gray-600">Color</Label>
                    <ColorInput
                      value={formData.design.background_color}
                      onChange={(v) => handleChange('design.background_color', v)}
                    />
                  </div>
                )}

                {formData.design.background_type === 'gradient' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Start Color</Label>
                      <ColorInput
                        value={formData.design.gradient_start}
                        onChange={(v) => handleChange('design.gradient_start', v)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">End Color</Label>
                      <ColorInput
                        value={formData.design.gradient_end}
                        onChange={(v) => handleChange('design.gradient_end', v)}
                      />
                    </div>
                  </div>
                )}

                {formData.design.background_type === 'image' && (
                  <div className="space-y-3">
                    <div>
                      {formData.design.background_image ? (
                        <div className="flex items-center gap-2">
                          <img src={formData.design.background_image} alt="Background" className="w-20 h-20 object-cover rounded border" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleChange('design.background_image', '')}
                          >
                            <X className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id="background-image"
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageUpload}
                            disabled={uploadingBackgroundImage}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('background-image').click()}
                            disabled={uploadingBackgroundImage}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingBackgroundImage ? 'Uploading...' : 'Upload Image'}
                          </Button>
                          <p className="text-xs text-gray-500">Max 5MB</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Background Opacity</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.design.background_opacity}
                        onChange={(e) => handleChange('design.background_opacity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">{Math.round(formData.design.background_opacity * 100)}%</p>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Color Overlay</Label>
                      <ColorInput
                        value={formData.design.overlay_color}
                        onChange={(v) => handleChange('design.overlay_color', v)}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Overlay Opacity</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.design.overlay_opacity}
                        onChange={(e) => handleChange('design.overlay_opacity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">{Math.round(formData.design.overlay_opacity * 100)}%</p>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600 mb-2 block">Image Saturation</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.design.background_saturation}
                        onChange={(e) => handleChange('design.background_saturation', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.design.background_saturation}%</p>
                    </div>

                  </div>
                )}
              </div>

              {/* Typography */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-medium">Typography</Label>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Font</Label>
                  <Select value={formData.design.font_family} onValueChange={(v) => handleChange('design.font_family', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_sans">Open Sans</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Title Color</Label>
                  <ColorInput
                    value={formData.design.title_color}
                    onChange={(v) => handleChange('design.title_color', v)}
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Description Color</Label>
                  <ColorInput
                    value={formData.design.description_color}
                    onChange={(v) => handleChange('design.description_color', v)}
                  />
                </div>
              </div>

              {/* Button Styling */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="font-medium">Button Style</Label>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Shape</Label>
                  <Select value={formData.design.button_style} onValueChange={(v) => handleChange('design.button_style', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="pill">Pill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Button Color</Label>
                  <ColorInput
                    value={formData.design.button_color}
                    onChange={(v) => handleChange('design.button_color', v)}
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Button Text Color</Label>
                  <ColorInput
                    value={formData.design.button_text_color}
                    onChange={(v) => handleChange('design.button_text_color', v)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Setup */}
          {stepValue === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="custom-slug">Custom URL Slug (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">qr-sensei.com/linkpage/</span>
                    <Input
                      id="custom-slug"
                      placeholder="e.g., stark-industries"
                      value={formData.custom_slug}
                      onChange={(e) => handleChange('custom_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Preview:</strong> qr-sensei.com/linkpage/{formData.custom_slug || 'your-slug'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">If not provided, a random slug will be generated</p>
              </div>

              <div>
                <Label htmlFor="browser-title">Browser Tab Title *</Label>
                <Input
                  id="browser-title"
                  placeholder="e.g., Stark Industries"
                  value={formData.browser_title}
                  onChange={(e) => handleChange('browser_title', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Shown in browser tab and search results</p>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
