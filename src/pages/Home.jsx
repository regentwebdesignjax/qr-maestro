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
             Master the Art of the Scan: Professional QR Code Solutions.
           </h1>
           <p className="text-xl text-gray-600 mb-8">
             QR Sensei provides advanced <span className="font-semibold">Static and Dynamic QR Code generation</span> with a master's touch. Create, customize, and track your codes with precision.
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
                 Multiple QR code types: URLs, Plain Text, WiFi Credentials, and vCard Contacts
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Palette className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Bespoke Gi</CardTitle>
               <CardDescription>
                 Custom Colors, Logo Uploads, Gradient Effects, and Pattern Styles
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mb-4" />
              <CardTitle>The Fluid Form</CardTitle>
               <CardDescription>
                 Dynamic QR Codes: Edit your destination URL anytime without reprinting
               </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Inner Vision</CardTitle>
               <CardDescription>
                 Real-time Scan Analytics: Location, Device Type, Browser, and Temporal Data
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
             Begin Your Professional Journey
           </h2>
           <p className="text-gray-600 mb-8">
             Start free with 3 Static QR Codes. Upgrade to Black Belt for unlimited codes, dynamic management, and detailed analytics.
           </p>
           <Button size="lg" onClick={handleGetStarted}>
             Create Your First QR Code
           </Button>
        </div>
      </div>
    </div>
  );
}