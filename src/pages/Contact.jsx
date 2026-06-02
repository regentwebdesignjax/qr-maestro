import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Mail } from 'lucide-react';

const REASONS = [
  'General Inquiry',
  'Technical Support',
  'Billing & Subscription',
  'Feature Request',
  'Partnership / Sales',
  'Report a Bug',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', org_name: '', reason: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleReason = (val) => setForm(prev => ({ ...prev, reason: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.reason || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke('sendSupportEmail', form);
    setLoading(false);
    if (res.data?.success) {
      setSubmitted(true);
    } else {
      setError(res.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 mb-5">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Contact & Support</h1>
          <p className="text-white/70 text-base sm:text-lg">
            Have a question or need help? We typically respond within one business day.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {submitted ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
            <p className="text-muted-foreground">Thanks for reaching out. We'll get back to you soon.</p>
            <Button className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', org_name: '', reason: '', message: '' }); }}>
              Send Another Message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-card space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name <span className="text-primary">*</span></Label>
                <Input id="name" name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-primary">*</span></Label>
                <Input id="email" name="email" type="email" placeholder="jane@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org_name">Organization <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="org_name" name="org_name" placeholder="Acme Corp" value={form.org_name} onChange={handleChange} />
            </div>

            <div className="space-y-1.5">
              <Label>Reason for Reaching Out <span className="text-primary">*</span></Label>
              <Select onValueChange={handleReason} value={form.reason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message <span className="text-primary">*</span></Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us how we can help..."
                value={form.message}
                onChange={handleChange}
                className="min-h-[140px] resize-y"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}