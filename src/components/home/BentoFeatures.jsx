import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, BarChart3, Palette, Shield } from 'lucide-react';

const GOLD = '#D4AF37';

export default function BentoFeatures() {
  return (
    <section className="w-full py-24 px-[5vw]" style={{ backgroundColor: '#F9F9F8' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Everything You Need</p>
          <h2 className="text-4xl font-black text-foreground">The Scroll of Features</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
          {/* Large 2x2 */}
          <div className="col-span-2 row-span-2 bg-[#142024] text-white rounded-2xl p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 cursor-default">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-4 inline-block" style={{ color: GOLD, borderColor: GOLD }}>
                Black Belt Exclusive
              </span>
              <h3 className="text-2xl font-black mt-3 mb-3">The Way of Water</h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                Dynamic QR codes that bend to your will. Update the destination URL at any time without reprinting a single code. Run multiple campaigns from one printed asset.
              </p>
            </div>
            <Link to="/Pricing" className="mt-6">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Unlock Dynamic Codes
              </Button>
            </Link>
          </div>

          {/* Medium 2x1 */}
          <div className="col-span-2 bg-white border border-border rounded-2xl p-6 flex items-start gap-4 hover:scale-[1.02] transition-transform duration-300 cursor-default hover:shadow-card-hover">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border inline-block mb-2" style={{ color: GOLD, borderColor: GOLD }}>
                Pro Analytics
              </span>
              <h3 className="text-lg font-black text-foreground">Inner Vision</h3>
              <p className="text-sm text-muted-foreground mt-1">Real-time scan analytics — location, device, time. Know exactly who is engaging with your codes.</p>
            </div>
          </div>

          {/* Small 1x1 */}
          <div className="col-span-1 bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-300 cursor-default hover:shadow-card-hover">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-black text-foreground text-base leading-tight">Bespoke Gi</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Custom colors, logos, gradients & eye shapes. Your brand, your code.</p>
          </div>

          {/* Small 1x1 */}
          <div className="col-span-1 bg-[#142024] text-white rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-300 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-black text-white text-base leading-tight">The Iron Guard</h3>
            <p className="text-xs text-gray-300 leading-relaxed">Enterprise-grade security with unlimited scans and zero data selling. Your customers stay yours.</p>
          </div>
        </div>
      </div>
    </section>
  );
}