import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, BarChart3, Palette } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PathToMastery from '@/components/home/PathToMastery';
import Testimonials from '@/components/home/Testimonials';
import BentoFeatures from '@/components/home/BentoFeatures';

export default function Home() {
  const handleGetStarted = () => {
    base44.auth.redirectToLogin('/Dashboard');
  };

  const mockChartData = [
    { date: 'Apr 12', scans: 14 },
    { date: 'Apr 13', scans: 28 },
    { date: 'Apr 14', scans: 19 },
    { date: 'Apr 15', scans: 45 },
    { date: 'Apr 16', scans: 37 },
    { date: 'Apr 17', scans: 62 },
    { date: 'Apr 18', scans: 54 },
  ];

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
            <h1 className="text-6xl font-black text-white mb-6 font-poppins leading-tight">
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
                  className="bg-transparent border border-white text-white hover:bg-white hover:text-[#142024] font-semibold transition-colors duration-200"
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

      {/* Path to Mastery Stepper */}
      <PathToMastery />

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
              <h2 className="text-4xl font-black text-gray-900 mb-4 max-w-2xl font-poppins">
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
            <div className="order-2 rounded-xl p-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-card-hover">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">Live Scan Activity — Last 7 Days</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#142024', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="scans" fill="#BB3F27" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="order-1">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Inner Vision</h3>
              </div>
              <h2 className="text-4xl font-black text-white mb-4 max-w-2xl font-poppins">
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
                src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/eb0a8a8a8_sensei-design.png"
                alt="Bespoke Gi"
                className="w-full max-w-xl drop-shadow-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-6 h-6 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Bespoke Gi</h3>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-4 max-w-2xl font-poppins">
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

      {/* Testimonials */}
      <Testimonials />

      {/* Bento Features */}
      <BentoFeatures />

      {/* Final CTA */}
      <div className="w-screen py-24 px-[5vw]" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-6 font-poppins">
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