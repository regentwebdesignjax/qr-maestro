import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, BarChart3, Palette, Cloud, Headphones, Database, ArrowRight, Users, RefreshCw } from 'lucide-react';

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
      <Container className="py-16">
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

        {/* HubSpot CRM Callout */}
        <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden mb-16">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Text */}
            <div className="p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                Black Belt Exclusive
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Seamless HubSpot CRM Sync
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Leads captured from your Digital Business Cards flow directly into HubSpot — automatically. No manual exports, no copy-paste, no lost contacts. Your sales pipeline stays in sync from the moment someone scans your card.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  { icon: Users, text: 'Auto-create or update HubSpot contacts on lead capture' },
                  { icon: RefreshCw, text: 'Email-based deduplication keeps your CRM clean' },
                  { icon: Database, text: 'Segment leads with custom properties & dynamic lists' },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link to="/Pricing" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline w-fit">
                Unlock with Black Belt <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Right: Visual */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-10 flex items-center justify-center">
              <div className="w-full max-w-xs space-y-3">
                {/* Mock CRM sync card */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">HS</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">HubSpot CRM</p>
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Connected</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Sarah Johnson → synced ✓', 'Mike Chen → synced ✓', 'Priya Patel → syncing...'].map((row, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-gray-700">{row}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-center text-orange-600 font-medium">Leads sync in real-time from your Digital Business Cards</p>
              </div>
            </div>
          </div>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/Dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200">
                Create Your First QR Code
              </Button>
            </Link>
            <Link to="/Pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-colors duration-200">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}