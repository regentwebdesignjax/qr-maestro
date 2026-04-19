import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Zap, Users } from 'lucide-react';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalSeats, setTotalSeats] = useState(10);

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
  const monthlyTotal = 29 + extraSeats * 3;
  const annualTotal = 290 + extraSeats * 36;

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
      <div className="container mx-auto px-4">
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
                  <span>Up to 3 Static QR Codes</span>
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
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-24 text-center font-semibold"
                  />
                  <span className="text-sm text-gray-500">
                    {extraSeats > 0 ? `+${extraSeats} extra @ $3/mo each` : 'First 10 included'}
                  </span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{totalSeats} Digital Business Cards</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Dynamic QR Codes (The Fluid Form)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Real-time Scan Analytics (Inner Vision)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom Colors, Logos & Gradients (Bespoke Gi)</span>
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
              {extraSeats > 0 ? (
                <p className="text-xs text-gray-500 mt-1">$290 base + {extraSeats} extra DBC{extraSeats > 1 ? 's' : ''} × $36</p>
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
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-24 text-center font-semibold"
                  />
                  <span className="text-sm text-gray-500">
                    {extraSeats > 0 ? `+${extraSeats} extra @ $36/yr each` : 'First 10 included'}
                  </span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">{totalSeats} Digital Business Cards</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Dynamic QR Codes (The Fluid Form)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Real-time Scan Analytics (Inner Vision)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom Colors, Logos & Gradients (Bespoke Gi)</span>
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

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All plans include
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <span>High-quality QR code generation</span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <span>High-resolution PNG export</span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <span>Multiple QR code types</span>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <span>No hidden fees or charges</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}