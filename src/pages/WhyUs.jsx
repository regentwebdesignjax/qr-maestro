import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, BarChart3, Palette, Cloud, Headphones } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Shield,
      title: 'The Iron Guard',
      description: 'Enterprise-grade security with 99.9% uptime. Your QR codes are protected with the strength of steel.'
    },
    {
      icon: Zap,
      title: 'Speed of the Cobra',
      description: 'Generate QR codes in seconds. Our optimized infrastructure strikes with lightning precision.'
    },
    {
      icon: BarChart3,
      title: 'Inner Vision',
      description: 'See with clarity through detailed analytics including location, device type, and temporal insights.'
    },
    {
      icon: Palette,
      title: 'Bespoke Gi',
      description: 'Craft QR codes with custom colors, logos, and designs that mirror your unique spirit.'
    },
    {
      icon: Cloud,
      title: 'The Way of Water',
      description: 'Adapt and flow - update your QR code content anytime without reprinting or struggle.'
    },
    {
      icon: Headphones,
      title: 'The Mentor\'s Hand',
      description: 'When the path becomes unclear, our guides are ready to illuminate your way.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
             The Path to QR Mastery
           </h1>
           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
             QR Sensei guides you through the journey of digital mastery. Discover why warriors and sages alike 
             choose our way for their QR code disciplines.
           </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {reasons.map((reason, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <reason.icon className="w-6 h-6 text-primary" />
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
              <div className="text-4xl font-bold text-primary mb-2">1M+</div>
              <div className="text-gray-600">QR Codes Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
             Ready to Begin Your Training?
           </h2>
           <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
             Thousands of warriors and sages have already chosen the path of QR Sensei. 
             Your journey to mastery awaits.
           </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg">
                Strike Your First Code
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