import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ImageUploader({ label, hint, value, onChange, id, previewSize = 'w-full h-32' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const url = result?.file_url || result?.data?.file_url;
      if (url) onChange(url);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      {value ? (
        <div className="mt-1 space-y-2">
          <img src={value} alt={label} className={`${previewSize} object-cover rounded border`} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange('')}
          >
            <X className="w-3 h-3 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <div className="mt-1">
          <Input
            id={id}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(id).click()}
            disabled={uploading}
          >
            <Upload className="w-3 h-3 mr-1" />
            {uploading ? 'Uploading...' : `Upload ${label}`}
          </Button>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
      )}
    </div>
  );
}

export default function BusinessPageForm({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleScheduleChange = (dayIndex, field, value) => {
    const newSchedule = [...(data.schedule || [])];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    onChange({ ...data, schedule: newSchedule });
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

        <div>
          <Label className="text-xs text-gray-500">Title</Label>
          <Input
            placeholder="e.g., Owner, Manager, Director"
            value={data.contact_title || ''}
            onChange={(e) => handleChange('contact_title', e.target.value)}
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

        <ImageUploader
          label="Brand Image (Header)"
          hint="Recommended: 1200×400px • Max 5MB"
          value={data.brand_image}
          onChange={(url) => handleChange('brand_image', url)}
          id="brand-image"
        />

        <ImageUploader
          label="Logo"
          hint="PNG/JPG • Max 2MB"
          value={data.logo}
          onChange={(url) => handleChange('logo', url)}
          id="logo"
          previewSize="w-20 h-20"
        />
      </div>
    </div>
  );
}
