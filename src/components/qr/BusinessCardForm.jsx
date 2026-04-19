import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X, User, Building2, Link2, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function SECTION({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ImageUploader({ label, hint, value, onChange, id }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const url = result?.file_url || result?.data?.file_url;
      if (url) onChange(url);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label className="text-xs text-gray-600">{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 mt-1">
          <img src={value} alt={label} className="h-14 w-14 object-cover rounded-lg border" />
          <Button type="button" variant="outline" size="sm" onClick={() => onChange('')}>
            <X className="w-3 h-3 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <div className="mt-1">
          <Input id={id} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(id).click()} disabled={uploading}>
            <Upload className="w-3 h-3 mr-1" />{uploading ? 'Uploading...' : `Upload ${label}`}
          </Button>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
      )}
    </div>
  );
}

export default function BusinessCardForm({ data, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  const socialLinks = data.social_links || [];

  const addLink = () => {
    set('social_links', [...socialLinks, { platform: '', url: '' }]);
  };

  const updateLink = (idx, field, value) => {
    const next = socialLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l);
    set('social_links', next);
  };

  const removeLink = (idx) => {
    set('social_links', socialLinks.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Identity */}
      <SECTION icon={User} title="Identity">
        <ImageUploader
          id="dbc-headshot"
          label="Headshot"
          hint="Recommended: 600×600px (square)"
          value={data.headshot_url || ''}
          onChange={(v) => set('headshot_url', v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Full Name *</Label>
            <Input className="mt-1" placeholder="Alex Johnson" value={data.name || ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Job Title</Label>
            <Input className="mt-1" placeholder="Head Sensei" value={data.title || ''} onChange={(e) => set('title', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Bio</Label>
          <Textarea className="mt-1" placeholder="A brief intro about yourself..." rows={3} value={data.bio || ''} onChange={(e) => set('bio', e.target.value)} />
        </div>
      </SECTION>

      {/* Company */}
      <SECTION icon={Building2} title="The Dojo (Company)">
        <ImageUploader
          id="dbc-banner"
          label="Brand Banner"
          hint="Recommended: 1200×400px (3:1 ratio)"
          value={data.banner_url || ''}
          onChange={(v) => set('banner_url', v)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Company Name</Label>
            <Input className="mt-1" placeholder="Sensei Corp" value={data.company || ''} onChange={(e) => set('company', e.target.value)} />
          </div>
          <ImageUploader
            id="dbc-company-logo"
            label="Company Logo"
            value={data.company_logo_url || ''}
            onChange={(v) => set('company_logo_url', v)}
          />
        </div>
      </SECTION>

      {/* Connections */}
      <SECTION icon={Link2} title="Connections">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Phone</Label>
            <Input className="mt-1" placeholder="+1 555-0100" value={data.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Email</Label>
            <Input className="mt-1" type="email" placeholder="alex@sensei.io" value={data.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Website</Label>
          <Input className="mt-1" placeholder="https://sensei.io" value={data.website || ''} onChange={(e) => set('website', e.target.value)} />
        </div>

        {/* Dynamic Social Links */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Social Links</Label>
          {socialLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="Platform (e.g. LinkedIn)"
                value={link.platform}
                onChange={(e) => updateLink(idx, 'platform', e.target.value)}
                className="w-32 shrink-0"
              />
              <Input
                placeholder="URL or handle"
                value={link.url}
                onChange={(e) => updateLink(idx, 'url', e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeLink(idx)}>
                <Trash2 className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="w-3 h-3 mr-1" /> Add Link
          </Button>
        </div>
      </SECTION>
    </div>
  );
}