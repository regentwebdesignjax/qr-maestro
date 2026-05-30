import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Zap, Users, Globe, MousePointerClick, BarChart2, Puzzle, TrendingUp } from 'lucide-react';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalSeats, setTotalSeats] = useState(10);
  const [inputSeats, setInputSeats] = useState('10');
  const [includeCustomDomain, setIncludeCustomDomain] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // User not logged in
      }
    };
    fetchUser();
  }, []);

  const isPro = user?.subscription_tier === 'pro' && user?.subscription_status === 'active';
  const extraSeats = Math.max(0, totalSeats - 10);
  const customDomainMonthly = includeCustomDomain ? 19 : 0;
  const customDomainAnnual = includeCustomDomain ? 190 : 0;
  const monthlyTotal = 29 + extraSeats * 3 + customDomainMonthly;
  const annualTotal = 249 + extraSeats * 36 + customDomainAnnual;

  const handleUpgrade = async (period) => {
    if (!user) {
      base44.analytics.track({ eventName: 'upgrade_cta_clicked', properties: { period, logged_in: false } });
      base44.auth.redirectToLogin('/Pricing');
      return;
    }

    setLoading(true);
    base44.analytics.track({
      eventName: 'upgrade_checkout_initiated',
      properties: { plan: 'black_belt', period, user_email: user.email, total_seats: totalSeats },
    });
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        period,
        user_id: user.id,
        email: user.email,
        total_seats: totalSeats,
        include_custom_domain: includeCustomDomain,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPortalSession', {
        customer_id: user.stripe_customer_id,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open subscription portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choosing Your Rank
          </h1>
          <p className="text-xl text-gray-600">
            Ascend from White Belt mastery to Black Belt excellence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Free Plan */}
          <Card className="border-2 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">White Belt</CardTitle>
              <CardDescription>Begin your journey</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Up to 10 Static QR Codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Digital Business Card (Static)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Basic Customization (Colors)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>PNG Download</span>
                </li>
              </ul>
              <div className="pt-2">
                {user ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isPro ? 'Downgrade' : 'Current Plan'}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors duration-200" onClick={() => base44.auth.redirectToLogin('/Dashboard')}>
                    Get Started
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className="border-2 border-primary relative flex flex-col">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
              Most Chosen
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Black Belt (Monthly)</CardTitle>
              <CardDescription>Master the way of the code</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${monthlyTotal}</span>
                <span className="text-gray-600">/month</span>
              </div>
              {extraSeats > 0 && (
                <p className="text-xs text-gray-500 mt-1">$29 base + {extraSeats} extra DBC{extraSeats > 1 ? 's' : ''} × $3</p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              {/* DBC Seat Selector */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-primary" />
                  Total Digital Business Cards needed
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                   type="number"
                   min={10}
                   value={inputSeats}
                   onChange={(e) => {
                     const raw = e.target.value;
                     setInputSeats(raw);
                     const parsed = Math.max(10, parseInt(raw) || 10);
                     setTotalSeats(parsed);
                   }}
                   onBlur={() => {
                     const val = Math.max(10, parseInt(inputSeats) || 10);
                     setInputSeats(String(val));
                     setTotalSeats(val);
                   }}
                   className="w-24 text-center font-semibold focus:ring-2 focus:ring-[#BB3F27]"
                  />
                  <span className="text-sm text-gray-500">
                   {extraSeats > 0 ? `+${extraSeats} extra @ $3/mo each` : 'First 10 included'}
                  </span>
                </div>
              </div>
              {/* Custom Domain Add-On */}
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${includeCustomDomain ? 'bg-primary/5 border-primary/40' : 'bg-white border-gray-200 hover:border-primary/30'}`}
                onClick={() => setIncludeCustomDomain(v => !v)}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCustomDomain}
                    onChange={(e) => setIncludeCustomDomain(e.target.checked)}
                    className="mt-1 accent-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-800">
                      <Globe className="w-4 h-4 text-primary" />
                      Custom Domain Add-On
                      <span className="ml-auto text-primary font-bold">+$19/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Brand your QR codes with your own domain (e.g. qr.yourbrand.com)
                    </p>
                  </div>
                </label>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Unlimited Static & Dynamic QRs</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{totalSeats} Digital Business Cards</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Linkpages</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Business Pages</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Real-time Scan Analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">HubSpot CRM Integration</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom Colors, Logos & Gradients</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Unlimited Scans</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <div className="pt-2">
                {isPro && user?.subscription_period === 'monthly' ? (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={loading}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200" onClick={() => handleUpgrade('monthly')} disabled={loading || (isPro && user?.subscription_period === 'annual')}>
                    <Zap className="w-4 h-4 mr-2" />
                    {user ? 'Upgrade to Pro' : 'Sign Up Now'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-2 relative flex flex-col">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
              Grand Master Path
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Black Belt (Annual)</CardTitle>
              <CardDescription>The path of mastery - save 28%</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${annualTotal}</span>
                <span className="text-gray-600">/year</span>
              </div>
              {extraSeats > 0 || includeCustomDomain ? (
                <p className="text-xs text-gray-500 mt-1">
                  $249 base{extraSeats > 0 ? ` + ${extraSeats} DBC${extraSeats > 1 ? 's' : ''} × $36` : ''}{includeCustomDomain ? ' + $190 custom domain' : ''}
                </p>
              ) : (
                <p className="text-sm text-green-600 font-medium">Just ${(annualTotal / 12).toFixed(2)}/month</p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              {/* DBC Seat Selector */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-green-600" />
                  Total Digital Business Cards needed
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                   type="number"
                   min={10}
                   value={inputSeats}
                   onChange={(e) => {
                     const raw = e.target.value;
                     setInputSeats(raw);
                     const parsed = Math.max(10, parseInt(raw) || 10);
                     setTotalSeats(parsed);
                   }}
                   onBlur={() => {
                     const val = Math.max(10, parseInt(inputSeats) || 10);
                     setInputSeats(String(val));
                     setTotalSeats(val);
                   }}
                   className="w-24 text-center font-semibold focus:ring-2 focus:ring-[#BB3F27]"
                  />
                  <span className="text-sm text-gray-500">
                   {extraSeats > 0 ? `+${extraSeats} extra @ $36/yr each` : 'First 10 included'}
                  </span>
                </div>
              </div>
              {/* Custom Domain Add-On */}
              <div
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${includeCustomDomain ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200 hover:border-green-300'}`}
                onClick={() => setIncludeCustomDomain(v => !v)}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCustomDomain}
                    onChange={(e) => setIncludeCustomDomain(e.target.checked)}
                    className="mt-1 accent-green-600"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-800">
                      <Globe className="w-4 h-4 text-green-600" />
                      Custom Domain Add-On
                      <span className="ml-auto text-green-700 font-bold">+$190/yr</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Brand your QR codes with your own domain (e.g. qr.yourbrand.com)
                    </p>
                  </div>
                </label>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Unlimited Static & Dynamic QRs</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{totalSeats} Digital Business Cards</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Linkpages</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Business Pages</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Real-time Scan Analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">HubSpot CRM Integration</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom Colors, Logos & Gradients</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Unlimited Scans</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <div className="pt-2">
                {isPro && user?.subscription_period === 'annual' ? (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={loading}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200" onClick={() => handleUpgrade('annual')} disabled={loading || (isPro && user?.subscription_period === 'monthly')}>
                    <Zap className="w-4 h-4 mr-2" />
                    {user ? 'Upgrade to Pro' : 'Sign Up Now'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why Choose QR Sensei */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Why Choose QR Sensei?</h2>
          <p className="text-gray-500 text-center mb-10">Everything you need to connect, track, and grow — in one platform.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 bg-white border border-border rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Simple & Intuitive</h3>
                <p className="text-sm text-gray-500">Create stunning QR codes, digital business cards, and linkpages in minutes — no design experience needed.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white border border-border rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Built for Growth</h3>
                <p className="text-sm text-gray-500">Scale from a solo operator to a full team. Add digital business card seats as your business expands.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white border border-border rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Data-Driven Decisions</h3>
                <p className="text-sm text-gray-500">Real-time scan analytics with device, location, and time-of-day insights so you always know what's working.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white border border-border rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Puzzle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Seamless Integrations</h3>
                <p className="text-sm text-gray-500">Connect your HubSpot CRM to automatically sync leads captured from your digital business cards — no manual export needed.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}