import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BusinessPageForm({ data, onChange }) {
  const [uploadingBrandImage, setUploadingBrandImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleScheduleChange = (dayIndex, field, value) => {
    const newSchedule = [...(data.schedule || [])];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    onChange({ ...data, schedule: newSchedule });
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'brand_image') setUploadingBrandImage(true);
    if (field === 'logo') setUploadingLogo(true);

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const url = result?.file_url || result?.data?.file_url;

      if (!url) {
        throw new Error('No URL returned from upload endpoint');
      }

      console.log(`[${field}] Image uploaded successfully:`, url);
      handleChange(field, url);
    } catch (error) {
      console.error(`[${field}] Upload failed:`, error);
      alert(`Failed to upload ${field === 'brand_image' ? 'brand image' : 'logo'}: ${error.message}`);
    } finally {
      if (field === 'brand_image') setUploadingBrandImage(false);
      if (field === 'logo') setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div className="border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm">Business Information</h3>

        <div>
          <Label className="text-xs text-gray-500">Business Name *</Label>
          <Input
            placeholder="Your Business Name"
            value={data.business_name || ''}
            onChange={(e) => handleChange('business_name', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Headline</Label>
          <Input
            placeholder="e.g., Premium Coffee & Pastries"
            value={data.headline || ''}
            onChange={(e) => handleChange('headline', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Message / Description</Label>
          <Textarea
            placeholder="Tell customers about your business..."
            value={data.message || ''}
            onChange={(e) => handleChange('message', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm">Contact Information</h3>

        <div>
          <Label className="text-xs text-gray-500">Contact Name</Label>
          <Input
            placeholder="Owner/Manager Name"
            value={data.contact_name || ''}
            onChange={(e) => handleChange('contact_name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Phone</Label>
            <Input
              placeholder="(555) 123-4567"
              value={data.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Email</Label>
            <Input
              placeholder="info@business.com"
              type="email"
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm">Location</h3>

        <div>
          <Label className="text-xs text-gray-500">Address</Label>
          <Input
            placeholder="123 Main Street, City, State 12345"
            value={data.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500">Latitude</Label>
            <Input
              placeholder="40.7128"
              type="number"
              step="any"
              value={data.latitude || ''}
              onChange={(e) => handleChange('latitude', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Longitude</Label>
            <Input
              placeholder="-74.0060"
              type="number"
              step="any"
              value={data.longitude || ''}
              onChange={(e) => handleChange('longitude', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Button Customization */}
      <div className="border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm">Call-to-Action Button</h3>

        <div>
          <Label className="text-xs text-gray-500">Button Title</Label>
          <Input
            placeholder="e.g., Learn More, Order Now, Visit Us"
            value={data.button_title || 'Learn More'}
            onChange={(e) => handleChange('button_title', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Button Link URL</Label>
          <Input
            placeholder="https://your-website.com"
            value={data.button_url || ''}
            onChange={(e) => handleChange('button_url', e.target.value)}
          />
        </div>

        <div>
          <Label className="text-xs text-gray-500">Button Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="color"
              value={data.button_color || '#2f3f7f'}
              onChange={(e) => handleChange('button_color', e.target.value)}
              className="w-14 h-10 p-1 cursor-pointer"
            />
            <span className="text-sm text-gray-600">{data.button_color || '#2f3f7f'}</span>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-sm">Business Hours</h3>
        </div>

        <div className="space-y-2">
          {data.schedule?.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <label className="w-20 font-medium text-gray-700">{day.day}</label>

              {day.closed ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Closed</span>
                  <button
                    type="button"
                    onClick={() => handleScheduleChange(idx, 'closed', false)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Open
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.open || '09:00'}
                    onChange={(e) => handleScheduleChange(idx, 'open', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <span className="text-gray-500">–</span>
                  <Input
                    type="time"
                    value={day.close || '17:00'}
                    onChange={(e) => handleScheduleChange(idx, 'close', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleScheduleChange(idx, 'closed', true)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div className="border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-sm">Branding</h3>

        <div>
          <Label className="text-xs text-gray-500">Brand Image (Header)</Label>
          {data.brand_image ? (
            <div className="mt-1 space-y-2">
              <img src={data.brand_image} alt="Brand" className="w-full h-32 object-cover rounded border" onError={(e) => { e.currentTarget.src = ''; console.error('Brand image failed to load'); }} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange('brand_image', '')}
              >
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="mt-1">
              <Input
                id="brand-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'brand_image')}
                disabled={uploadingBrandImage}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('brand-image').click()}
                disabled={uploadingBrandImage}
              >
                <Upload className="w-3 h-3 mr-1" />
                {uploadingBrandImage ? 'Uploading...' : 'Upload Image'}
              </Button>
              <p className="text-xs text-gray-400 mt-1">Recommended: 1200×400px • Max 5MB</p>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-gray-500">Logo</Label>
          {data.logo ? (
            <div className="mt-1 space-y-2">
              <img src={data.logo} alt="Logo" className="w-24 h-24 object-contain border rounded" onError={(e) => { e.currentTarget.src = ''; console.error('Logo failed to load'); }} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange('logo', '')}
              >
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="mt-1">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'logo')}
                disabled={uploadingLogo}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo').click()}
                disabled={uploadingLogo}
              >
                <Upload className="w-3 h-3 mr-1" />
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-gray-400 mt-1">PNG/JPG • Max 2MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
