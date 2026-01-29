import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleUpgrade = async (period) => {
    if (!user) {
      base44.auth.redirectToLogin('/Pricing');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        period,
        user_id: user.id,
        email: user.email,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Up to 3 Static QR codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Basic customization</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>PNG & SVG download</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled={isPro}>
                {isPro ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Plan */}
          <Card className="border-2 border-blue-600 relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
              Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Pro Monthly</CardTitle>
              <CardDescription>For businesses & marketers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Unlimited QR codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Dynamic QR codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Scan analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom colors & logos</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Unlimited scans</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              {isPro && user?.subscription_period === 'monthly' ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={loading}
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleUpgrade('monthly')}
                  disabled={loading || isPro}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-2">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
              Save $58
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Pro Annual</CardTitle>
              <CardDescription>Best value - 2 months free!</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$290</span>
                <span className="text-gray-600">/year</span>
              </div>
              <p className="text-sm text-green-600 font-medium">
                Just $24.17/month
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Unlimited QR codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Dynamic QR codes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span className="font-semibold">Scan analytics</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Custom colors & logos</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Unlimited scans</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              {isPro && user?.subscription_period === 'annual' ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={loading}
                >
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpgrade('annual')}
                  disabled={loading || isPro}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              )}
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
              <span>PNG and SVG export formats</span>
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