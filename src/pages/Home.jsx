import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, BarChart3, Palette } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TimeOfDayHeatmap from '@/components/analytics/TimeOfDayHeatmap';

export default function Home() {
  const handleGetStarted = () => {
    base44.auth.redirectToLogin('/Dashboard');
  };

  const now = new Date();
  const mockScans = Array.from({ length: 150 }, (_, i) => ({
    created_date: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));

  return (
    <div className="w-full bg-background">
      {/* Full-Width Split Hero */}
      <div className="flex w-screen h-screen overflow-hidden">
        {/* Left Panel: Dark with CTA */}
        <div
          className="flex-1 flex flex-col justify-center px-[5vw] py-16"
          style={{ backgroundColor: '#142024' }}
        >
          <div className="max-w-xl">
            <h1 className="text-6xl font-bold text-white mb-6 font-poppins leading-tight">
              Master the Art of the Scan
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-lg">
              QR Sensei provides professional QR code generation with custom styling, real-time analytics, and dynamic management. Elevate your brand.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Get Started Free
              </Button>
              <Link to="/Pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-sensei-black font-semibold transition-colors duration-200"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel: Light with Sensei Graphic */}
        <div
          className="flex-1 flex items-center justify-center px-[5vw] py-16"
          style={{ backgroundColor: '#F9F9F8' }}
        >
          <img
            src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/1842bba19_sensei-pose.png"
            alt="QR Sensei"
            className="w-full max-w-lg drop-shadow-xl"
          />
        </div>
      </div>

      {/* Feature Ribbon 1: The Fluid Form */}
      <div className="w-screen py-24 px-[5vw]" style={{ backgroundColor: '#F9F9F8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex items-center justify-center">
              <img
                src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/720f33124_sensei-fluid-form.png"
                alt="The Fluid Form"
                className="w-full max-w-sm drop-shadow-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">The Fluid Form</h3>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 max-w-2xl font-poppins">
                Dynamic QR Codes You Can Edit Anytime
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-3xl leading-relaxed">
                Unlike static codes, Dynamic QR codes allow you to update the destination URL in real-time without reprinting. Perfect for campaigns, promotions, and evolving strategies.
              </p>
              <Link to="/Pricing">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Unlock Dynamic Codes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Ribbon 2: Inner Vision Analytics */}
      <div className="w-screen py-24 px-[5vw]" style={{ backgroundColor: '#142024' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div
              className="rounded-xl p-8 shadow-card-hover bg-white order-2"
            >
              <TimeOfDayHeatmap scans={mockScans} />
            </div>
            <div className="order-1">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Inner Vision</h3>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 max-w-2xl font-poppins">
                See Every Scan in Real-Time
              </h2>
              <p className="text-lg text-gray-300 mb-6 max-w-3xl leading-relaxed">
                Track where your codes are scanned, what devices people use, and when engagement peaks. Make data-driven decisions with comprehensive analytics.
              </p>
              <Link to="/Pricing">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Explore Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Ribbon 3: Bespoke Gi */}
      <div className="w-screen py-24 px-[5vw]" style={{ backgroundColor: '#F9F9F8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex items-center justify-center">
              <img
                src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/f467416b9_sensei-pose.png"
                alt="Bespoke Gi"
                className="w-full max-w-sm drop-shadow-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Bespoke Gi</h3>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 max-w-2xl font-poppins">
                Custom Design Your QR Codes
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-3xl leading-relaxed">
                Choose custom colors, upload your logo, apply gradients, and select unique eye shapes. Make your QR codes unmistakably yours.
              </p>
              <Link to="/CreateQR">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Designing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="w-screen py-24 px-[5vw]" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 font-poppins">
            Begin Your Mastery
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free with 3 Static QR Codes. Upgrade to Black Belt for unlimited codes, dynamic management, and detailed analytics.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Create Your First QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}