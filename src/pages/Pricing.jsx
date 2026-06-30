import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Zap, Users, Globe, MousePointerClick, BarChart2, Puzzle, TrendingUp, Crown } from 'lucide-react';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const [bbSeats, setBbSeats] = useState(10);
  const [bbInputSeats, setBbInputSeats] = useState('10');

  const [gmSeats, setGmSeats] = useState(10);
  const [gmInputSeats, setGmInputSeats] = useState('10');

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

  const isAnnual = billingPeriod === 'annual';

  const isPaidActive = (tier) =>
    ['pro', 'grand_master'].includes(tier) && user?.subscription_status === 'active';

  const isBlackBelt = user?.subscription_tier === 'pro' && user?.subscription_status === 'active';
  const isGrandMaster = user?.subscription_tier === 'grand_master' && user?.subscription_status === 'active';
  const isAnyPro = isPaidActive(user?.subscription_tier);

  const bbExtraSeats = Math.max(0, bbSeats - 10);
  const gmExtraSeats = Math.max(0, gmSeats - 10);

  const bbMonthly = 29 + bbExtraSeats * 3;
  const bbAnnual = 249 + bbExtraSeats * 36;
  const gmMonthly = 49 + gmExtraSeats * 3;
  const gmAnnual = 490 + gmExtraSeats * 36;

  const handleUpgrade = async (plan) => {
    if (!user) {
      base44.analytics.track({ eventName: 'upgrade_cta_clicked', properties: { plan, period: billingPeriod, logged_in: false } });
      base44.auth.redirectToLogin('/Pricing');
      return;
    }

    setLoading(true);
    const seats = plan === 'grand_master' ? gmSeats : bbSeats;
    base44.analytics.track({
      eventName: 'upgrade_checkout_initiated',
      properties: { plan, period: billingPeriod, user_email: user.email, total_seats: seats }
    });
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan,
        period: billingPeriod,
        user_id: user.id,
        email: user.email,
        total_seats: seats,
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
        customer_id: user.stripe_customer_id
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

  const SeatSelector = ({ seats, inputSeats, setSeats, setInputSeats, extraSeats, color = 'primary' }) => (
    <div className={`bg-${color}/5 border border-${color}/20 rounded-lg p-3 space-y-2`}>
      <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Users className={`w-4 h-4 text-${color}`} />
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
            setSeats(parsed);
          }}
          onBlur={() => {
            const val = Math.max(10, parseInt(inputSeats) || 10);
            setInputSeats(String(val));
            setSeats(val);
          }}
          className="w-24 text-center font-semibold focus:ring-2 focus:ring-[#BB3F27]"
        />
        <span className="text-sm text-gray-500">
          {extraSeats > 0 ? `+${extraSeats} extra @ $3/mo each` : 'First 10 included'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choosing Your Rank</h1>
          <p className="text-xl text-gray-600">Ascend from White Belt mastery to Grand Master excellence</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Save 28%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">

          {/* White Belt — Free */}
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
                    {isAnyPro ? 'Downgrade' : 'Current Plan'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors duration-200"
                    onClick={() => base44.auth.redirectToLogin('/Dashboard')}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Black Belt */}
          <Card className="border-2 border-primary relative flex flex-col">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
              Most Chosen
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Black Belt</CardTitle>
              <CardDescription>Master the way of the code</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${isAnnual ? bbAnnual : bbMonthly}</span>
                <span className="text-gray-600">{isAnnual ? '/year' : '/month'}</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-green-600 font-medium">
                  Just ${(bbAnnual / 12).toFixed(2)}/month
                </p>
              )}
              {bbExtraSeats > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {isAnnual ? `$249 base + ${bbExtraSeats} extra DBC${bbExtraSeats > 1 ? 's' : ''} × $36` : `$29 base + ${bbExtraSeats} extra DBC${bbExtraSeats > 1 ? 's' : ''} × $3`}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <SeatSelector
                seats={bbSeats}
                inputSeats={bbInputSeats}
                setSeats={setBbSeats}
                setInputSeats={setBbInputSeats}
                extraSeats={bbExtraSeats}
                color="primary"
              />
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Up to 500 QR Codes (Static & Dynamic)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{bbSeats} Digital Business Cards</span>
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
                  <span className="font-semibold">HubSpot CRM Lead Sync</span>
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
                {isBlackBelt ? (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={loading}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200 text-sm"
                    onClick={() => handleUpgrade('black_belt')}
                    disabled={loading || isGrandMaster}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {user ? (isGrandMaster ? 'Current Plan or Higher' : 'Upgrade to Black Belt') : 'Sign Up Now'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grand Master */}
          <Card className="border-2 border-yellow-500 relative flex flex-col">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
              Grand Master
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                Grand Master
                <Crown className="w-5 h-5 text-yellow-500" />
              </CardTitle>
              <CardDescription>The path of true mastery</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${isAnnual ? gmAnnual : gmMonthly}</span>
                <span className="text-gray-600">{isAnnual ? '/year' : '/month'}</span>
              </div>
              {isAnnual && (
                <p className="text-sm text-green-600 font-medium">
                  Just ${(gmAnnual / 12).toFixed(2)}/month
                </p>
              )}
              {gmExtraSeats > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {isAnnual ? `$490 base + ${gmExtraSeats} extra DBC${gmExtraSeats > 1 ? 's' : ''} × $36` : `$49 base + ${gmExtraSeats} extra DBC${gmExtraSeats > 1 ? 's' : ''} × $3`}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <SeatSelector
                seats={gmSeats}
                inputSeats={gmInputSeats}
                setSeats={setGmSeats}
                setInputSeats={setGmInputSeats}
                extraSeats={gmExtraSeats}
                color="yellow-500"
              />
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Up to 1,500 QR Codes (Static & Dynamic)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">All Black Belt Features Included</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{gmSeats} Digital Business Cards</span>
                </li>
                <li className="flex items-start">
                  <Globe className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                  <span className="font-semibold text-yellow-700">Custom Domain — Included</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Brand your QRs with your own domain (e.g. qr.yourbrand.com)</span>
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
                {isGrandMaster ? (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={loading}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors duration-200"
                    onClick={() => handleUpgrade('grand_master')}
                    disabled={loading}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {user ? (isBlackBelt ? 'Upgrade to Grand Master' : 'Sign Up Now') : 'Sign Up Now'}
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
