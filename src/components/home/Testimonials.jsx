import React, { useEffect, useRef, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const testimonials = [
  {
    quote: "QR Sensei transformed how we run our restaurant menus. Dynamic codes saved us thousands in reprinting costs.",
    name: "Marcus T.",
    title: "Restaurant Owner, Austin TX",
    initials: "MT",
  },
  {
    quote: "The analytics dashboard is incredible. I can see exactly where my customers are scanning from in real time.",
    name: "Priya N.",
    title: "Marketing Director, SaaS Startup",
    initials: "PN",
  },
  {
    quote: "We embedded our logo directly into the QR code. Our brand consistency has never been better.",
    name: "James L.",
    title: "Brand Manager, Retail Chain",
    initials: "JL",
  },
  {
    quote: "Switching from our old provider was seamless. The custom design options are leagues ahead of the competition.",
    name: "Sofia R.",
    title: "Event Coordinator",
    initials: "SR",
  },
  {
    quote: "The sensei UI is genuinely fun to use. We created 40 QR codes for our trade show in under an hour.",
    name: "David K.",
    title: "Sales Lead, Enterprise Tech",
    initials: "DK",
  },
];

const brands = ['Acme Corp', 'Meridian Co.', 'Apex Studio', 'Novo Agency', 'Crest Digital', 'Summit Brands'];

export default function Testimonials() {
  const [api, setApi] = useState(null);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3500);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="w-full py-24 px-[5vw]" style={{ backgroundColor: '#F9F9F8' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Social Proof</p>
          <h2 className="text-4xl font-black text-foreground">Testimonials from the Masters</h2>
        </div>

        <Carousel setApi={setApi} opts={{ loop: true, align: 'center' }} className="w-full">
          <CarouselContent>
            {testimonials.map((t, i) => (
              <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                <div className="bg-white rounded-xl border border-border p-6 h-full flex flex-col gap-4 shadow-card hover:shadow-card-hover hover:scale-105 transition-all duration-300">
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.title}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Trusted By Marquee */}
        <div className="mt-14 border-t border-border pt-10">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-8">
            {brands.map((brand) => (
              <span key={brand} className="text-muted-foreground/50 font-bold text-sm uppercase tracking-wide grayscale hover:text-muted-foreground transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}