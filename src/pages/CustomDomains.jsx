import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Globe, CheckCircle2, Clock, AlertCircle, Copy, RefreshCw, Trash2, ArrowRight, Lock
} from 'lucide-react';

const CNAME_TARGET = 'customers.qr-sensei.com';

function StatusBadge({ status }) {
  if (status === 'active') {
    return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
  }
  if (status === 'deactivated') {
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Deactivated</Badge>;
  }
  return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
}

export default function CustomDomains() {
  const [user, setUser] = useState(null);
  const [customDomain, setCustomDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [hostname, setHostname] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [routingConfigured, setRoutingConfigured] = useState(true);
  const [routingError, setRoutingError] = useState('');

  const fetchStatus = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await base44.functions.invoke('checkDomainStatus', {});
      if (res.data?.customDomain) {
        setCustomDomain(res.data.customDomain);
        setRoutingConfigured(res.data.routingConfigured !== false);
        setRoutingError(res.data.routingError || '');
      } else {
        setCustomDomain(null);
        setRoutingConfigured(true);
        setRoutingError('');
      }
    } catch (e) {
      console.error('checkDomainStatus error:', e);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.custom_domain_addon) {
          await fetchStatus();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchStatus]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = hostname.trim().toLowerCase();
    if (!trimmed) { setError('Please enter a subdomain.'); return; }

    const parts = trimmed.split('.');
    if (parts.length < 3) {
      setError('Enter a full subdomain (e.g. qr.yourdomain.com), not just a domain name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('addCustomDomain', { hostname: trimmed });
      if (res.data?.error) {
        setError(res.data.error);
      } else if (res.data?.customDomain) {
        setCustomDomain(res.data.customDomain);
        setHostname('');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your custom domain? Your QR codes will stop working on that domain immediately.')) return;
    setRemoving(true);
    try {
      await base44.functions.invoke('deleteCustomDomain', {});
      setCustomDomain(null);
      // Refresh user so the addon flag updates
      const me = await base44.auth.me();
      setUser(me);
    } catch (e) {
      alert('Failed to remove domain. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const isPro = user?.subscription_tier === 'pro' && user?.subscription_status === 'active';
  const hasAddon = user?.custom_domain_addon === true;

  // Not Pro at all
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center space-y-4">
            <Lock className="w-12 h-12 text-gray-300 mx-auto" />
            <h1 className="text-2xl font-bold">Custom Domains</h1>
            <p className="text-gray-600">Custom domains are available on the Black Belt (Pro) plan.</p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/Pricing">View Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pro but no add-on
  if (!hasAddon) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center space-y-4">
            <Globe className="w-12 h-12 text-gray-300 mx-auto" />
            <h1 className="text-2xl font-bold">Custom Domains</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              Brand your QR codes with your own domain. Add the Custom Domain add-on to your
              Black Belt subscription for <strong>$19/month</strong> or <strong>$190/year</strong>.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/Pricing">
                Add Custom Domain Add-On <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Has add-on — manage domain
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            Custom Domain
          </h1>
          <p className="text-gray-600 mt-1">
            Connect your own subdomain so your QR codes redirect through your brand.
          </p>
        </div>

        {/* No domain registered yet */}
        {!customDomain && (
          <Card>
            <CardHeader>
              <CardTitle>Connect a Subdomain</CardTitle>
              <CardDescription>
                Enter the subdomain you want to use (e.g. <code className="bg-gray-100 px-1 rounded">qr.yourdomain.com</code>).
                Root domains are not supported — use a subdomain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="hostname">Your Subdomain</Label>
                  <Input
                    id="hostname"
                    type="text"
                    placeholder="qr.yourdomain.com"
                    value={hostname}
                    onChange={(e) => { setHostname(e.target.value); setError(''); }}
                    disabled={submitting}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={submitting}>
                  {submitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Connecting…</> : 'Connect Domain'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Domain exists */}
        {customDomain && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {customDomain.hostname}
                    <StatusBadge status={customDomain.status} />
                  </CardTitle>
                  <CardDescription>
                    {customDomain.status === 'active'
                      ? 'Your custom domain is live. New QR codes will use this domain automatically.'
                      : 'Waiting for DNS verification and SSL certificate issuance (usually 5–30 minutes).'}
                  </CardDescription>
                </div>
                {customDomain.status !== 'deactivated' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchStatus(true)}
                      disabled={refreshing}
                      title="Refresh verification status"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleRemove}
                      disabled={removing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* DNS Instructions — show while pending */}
            {customDomain.status === 'pending' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    Action Required: Add This DNS Record
                  </CardTitle>
                  <CardDescription className="text-yellow-800">
                    Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add the
                    following CNAME record. Once added, SSL certificate issuance begins automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-white border border-yellow-200 overflow-hidden text-sm font-mono">
                    <div className="grid grid-cols-[80px_1fr] gap-x-4 divide-y divide-yellow-100">
                      <div className="px-4 py-2 bg-yellow-50 font-semibold text-gray-600 text-xs uppercase tracking-wide">Type</div>
                      <div className="px-4 py-2">CNAME</div>
                      <div className="px-4 py-2 bg-yellow-50 font-semibold text-gray-600 text-xs uppercase tracking-wide">Name</div>
                      <div className="px-4 py-2">{customDomain.hostname.split('.')[0]}</div>
                      <div className="px-4 py-2 bg-yellow-50 font-semibold text-gray-600 text-xs uppercase tracking-wide">Target</div>
                      <div className="px-4 py-2 flex items-center justify-between gap-2">
                        <span>{CNAME_TARGET}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(CNAME_TARGET)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="px-4 py-2 bg-yellow-50 font-semibold text-gray-600 text-xs uppercase tracking-wide">TTL</div>
                      <div className="px-4 py-2">Auto (or 3600)</div>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-800">
                    After adding the record, click the refresh button above to check verification status.
                    DNS changes can take up to 30 minutes to propagate.
                  </p>
                  <div className="rounded-md bg-yellow-100 border border-yellow-300 px-3 py-2 text-xs text-yellow-900">
                    <strong>Using Cloudflare for your domain?</strong> Set the CNAME proxy status to <strong>DNS only (gray cloud)</strong> — not Proxied. Error 1000 only occurs if your domain registrar proxies the CNAME through their own Cloudflare zone; our setup does not cause this conflict.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active confirmation */}
            {customDomain.status === 'active' && routingConfigured && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-900">Domain verified and SSL active</p>
                    <p className="text-sm text-green-800">
                      All new dynamic QR codes you create will use{' '}
                      <strong>https://{customDomain.hostname}/</strong> as their base URL.
                      Existing QR codes continue to work on their original URLs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Routing not yet configured — worker origin patch pending */}
            {customDomain.status === 'active' && !routingConfigured && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-orange-900">Routing not yet configured — QR scans will time out</p>
                    <p className="text-sm text-orange-800">
                      Your domain is verified but the Worker origin could not be set automatically.
                      Click <strong>Refresh</strong> to retry. If this message persists, the Cloudflare
                      API is rejecting the origin server value — see the error below for details.
                    </p>
                    {routingError && (
                      <div className="rounded bg-orange-100 border border-orange-300 px-3 py-2 text-xs font-mono text-orange-900 break-all">
                        <strong>Cloudflare error:</strong> {routingError}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deactivated state */}
            {customDomain.status === 'deactivated' && (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="pt-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">Domain deactivated</p>
                    <p className="text-sm text-gray-600">
                      Your custom domain was removed. To use a custom domain again,
                      ensure your Custom Domain add-on is active and connect a new subdomain below.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setCustomDomain(null)}
                    >
                      Connect a New Domain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* How it works section */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">How Custom Domains Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">1.</span>
              <span>You connect a subdomain (e.g. <code className="bg-white px-1 rounded border">qr.yourbrand.com</code>) by adding a CNAME record at your DNS provider.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">2.</span>
              <span>We automatically provision an SSL certificate — no action needed on your end.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">3.</span>
              <span>New QR codes you create will embed your custom domain URL (e.g. <code className="bg-white px-1 rounded border">https://qr.yourbrand.com/abc123</code>).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">4.</span>
              <span>When someone scans the code, they're instantly redirected to your destination — no QR Sensei branding in the URL.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
