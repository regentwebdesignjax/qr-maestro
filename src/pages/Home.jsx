import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Zap, BarChart3, Palette, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Professional QR Code Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create, customize, and track QR codes for your business. Static and dynamic codes with analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started Free
              </Button>
            </Link>
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
              <QrCode className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Multiple Types</CardTitle>
              <CardDescription>
                Generate QR codes for URLs, text, WiFi credentials, and vCards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Palette className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Custom Design</CardTitle>
              <CardDescription>
                Customize colors and add logos to match your brand identity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Dynamic QR Codes</CardTitle>
              <CardDescription>
                Edit destination URLs without reprinting - perfect for marketing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Track scans, locations, and devices with detailed analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>High Quality</CardTitle>
              <CardDescription>
                Download in PNG or SVG format for print and digital use
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
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
            Start Creating QR Codes Today
          </h2>
          <p className="text-gray-600 mb-8">
            Free tier includes 3 static QR codes. Upgrade for unlimited codes and advanced features.
          </p>
          <Link to="/Dashboard">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Create Your First QR Code
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}