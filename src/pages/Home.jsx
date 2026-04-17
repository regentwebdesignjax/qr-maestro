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
      {/* Hero Section - Full Bleed */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-gradient-to-b from-background via-background to-secondary/20 py-20 md:py-32">
        <div className="mx-auto px-6 md:px-8 max-w-5xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 md:mb-8 leading-tight">
              Professional QR Code Generator
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Create, customize, and track QR codes for your business. Static and dynamic codes with advanced analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="h-12 sm:h-11 min-w-48">
                Get Started Free
              </Button>
              <Link to="/Pricing">
                <Button size="lg" variant="outline" className="h-12 sm:h-11 w-full sm:w-auto min-w-48">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Full Bleed */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-background py-24 md:py-32">
        <div className="mx-auto px-6 md:px-8 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <QrCode className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">Multiple Types</CardTitle>
                <CardDescription>
                  Generate QR codes for URLs, text, WiFi credentials, and vCards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <Palette className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">Custom Design</CardTitle>
                <CardDescription>
                  Customize colors and add logos to match your brand identity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <Zap className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">Dynamic QR Codes</CardTitle>
                <CardDescription>
                  Edit destination URLs without reprinting - perfect for marketing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <BarChart3 className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">Analytics</CardTitle>
                <CardDescription>
                  Track scans, locations, and devices with detailed analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <CheckCircle className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">High Quality</CardTitle>
                <CardDescription>
                  Download in high-resolution PNG format for print and digital use
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
              <CardHeader className="pb-4">
                <Zap className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-lg">Unlimited Scans</CardTitle>
                <CardDescription>
                  No limits on scans - your QR codes work forever
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section - Full Bleed */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-primary/5 border-t border-border py-20 md:py-28">
        <div className="mx-auto px-6 md:px-8 max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 md:mb-8 leading-tight">
              Start Creating QR Codes Today
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Free tier includes 3 static QR codes. Upgrade for unlimited codes and advanced features.
            </p>
            <Button size="lg" onClick={handleGetStarted} className="h-12 min-w-56">
              Create Your First QR Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}