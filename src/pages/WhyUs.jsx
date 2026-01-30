import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, BarChart3, Palette, Cloud, Headphones } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime. Your QR codes are safe and always accessible.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate QR codes in seconds. Our optimized infrastructure ensures quick loading and scanning.'
    },
    {
      icon: BarChart3,
      title: 'Powerful Analytics',
      description: 'Track scans with detailed analytics including location, device type, and time-based insights.'
    },
    {
      icon: Palette,
      title: 'Full Customization',
      description: 'Customize colors, add logos, and create QR codes that match your brand perfectly.'
    },
    {
      icon: Cloud,
      title: 'Dynamic QR Codes',
      description: 'Update your QR code content anytime without reprinting. Perfect for campaigns and marketing.'
    },
    {
      icon: Headphones,
      title: 'Premium Support',
      description: 'Get help when you need it. Our support team is here to ensure your success.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've built the most powerful, flexible, and user-friendly QR code platform on the market. 
            Here's what sets us apart from the competition.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {reasons.map((reason, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <reason.icon className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{reason.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">QR Codes Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses and individuals who trust our platform for their QR code needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Create Your First QR Code
              </Button>
            </Link>
            <Link to="/Pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}