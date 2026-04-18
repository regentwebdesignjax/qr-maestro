import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Crosshair, Palette, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Strike',
    subtitle: 'Choose Your Content',
    description: 'Select from URLs, vCards, WiFi, PDFs, and more. Define your intent with precision.',
    icon: Crosshair,
  },
  {
    number: '02',
    title: 'Form',
    subtitle: 'Design Your Code',
    description: 'Apply your brand colors, upload a logo, choose eye shapes and patterns. Make it unmistakably yours.',
    icon: Palette,
  },
  {
    number: '03',
    title: 'Deploy',
    subtitle: 'Track & Adapt',
    description: 'Launch your code and watch real-time analytics roll in. Update dynamic codes anytime without reprinting.',
    icon: BarChart3,
  },
];

export default function PathToMastery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="w-full py-24 px-[5vw] bg-background" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">The Method</p>
          <h2 className="text-4xl font-black text-foreground">The Path to Mastery</h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-border z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 32 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative z-10 bg-card border border-border rounded-xl p-7 hover:scale-105 transition-transform duration-300 hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-3xl font-black text-primary/20 leading-none">{step.number}</span>
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">{step.title}</h3>
                <p className="text-sm font-semibold text-primary mb-3">{step.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}