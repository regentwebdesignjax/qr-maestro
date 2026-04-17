import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Zap, BarChart3, Palette, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const handleGetStarted = () => {
    base44.auth.redirectToLogin('/Dashboard');
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
             Master the Art of the Scan.
           </h1>
           <p className="text-xl text-gray-600 mb-8">
             Whether you seek the speed of a <span className="font-semibold">Static Strike</span> or the wisdom of <span className="font-semibold">Dynamic Mastery</span>, QR Sensei guides your digital journey.
           </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              Get Started Free
            </Button>
            <Link to="/Pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <QrCode className="w-12 h-12 text-primary mb-4" />
              <CardTitle>The Versatile Stance</CardTitle>
               <CardDescription>
                 Multiple QR code types for URLs, text, WiFi, and contact information
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Palette className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Bespoke Gi</CardTitle>
               <CardDescription>
                 Customize colors, patterns, and add logos for your unique brand
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mb-4" />
              <CardTitle>The Fluid Form</CardTitle>
               <CardDescription>
                 Edit and adapt your QR codes anytime without reprinting
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Inner Vision</CardTitle>
               <CardDescription>
                 See where and how your QR codes are being scanned with detailed insights
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-primary mb-4" />
              <CardTitle>High Quality</CardTitle>
              <CardDescription>
                Download in high-resolution PNG format for print and digital use
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Unlimited Scans</CardTitle>
              <CardDescription>
                No limits on scans - your QR codes work forever
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
             Begin Your Training Today
           </h2>
           <p className="text-gray-600 mb-8">
             Start with the White Belt Rank (free): 3 Static Strikes included. Ascend to Black Belt status for unlimited codes and mastery.
           </p>
           <Button size="lg" onClick={handleGetStarted}>
             Strike Your First Code
           </Button>
        </div>
      </div>
    </div>
  );
}