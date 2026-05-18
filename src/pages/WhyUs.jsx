import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, BarChart3, Palette, Cloud, Headphones } from 'lucide-react';

export default function WhyUs() {
  const reasons = [
    {
      icon: Shield,
      title: 'Enterprise Security & Reliability',
      description: 'Enterprise-grade security with 99.9% uptime. Your QR codes are protected, scalable, and dependable for mission-critical campaigns.'
    },
    {
      icon: Zap,
      title: 'Lightning-Fast Deployment',
      description: 'Create and deploy QR codes in seconds. Our optimized infrastructure means you can react to opportunities in real-time.'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track location, device type, scan timing, and more. Make data-driven decisions with detailed, actionable insights.'
    },
    {
      icon: Palette,
      title: 'Custom Design',
      description: 'Choose custom colors, upload your logo, apply gradients, and select unique eye shapes. Your brand, your QR codes.'
    },
    {
      icon: Cloud,
      title: 'Update Anytime',
      description: 'Change where your QR codes link without reprinting. Perfect for pivoting campaigns, fixing links, and adapting to change.'
    },
    {
      icon: Headphones,
      title: 'World-Class Support',
      description: 'Questions about implementation? Need help with strategy? Our team is here to help you succeed.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
             Why Teams Choose QR Sensei
           </h1>
           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
             From marketing teams running campaigns to sales professionals capturing leads to event organizers managing attendees—QR Sensei
             is the platform that gives you control, insight, and results.
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
             Ready to Get Started?
           </h2>
           <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
             Thousands of teams are already using QR Sensei to create, manage, and track QR codes.
             Start free today and see why.
           </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200">
                Create Your First QR Code
              </Button>
            </Link>
            <Link to="/Pricing">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors duration-200">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}