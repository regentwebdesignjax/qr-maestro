import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Crosshair, Palette, BarChart3 } from 'lucide-react';

const steps = [
{
  number: '01',
  title: 'Select',
  subtitle: 'Choose Your Content',
  description: 'Select from URLs, vCards, WiFi, PDFs, and more. Define what your QR code should do.',
  icon: Crosshair
},
{
  number: '02',
  title: 'Customize',
  subtitle: 'Design Your Code',
  description: 'Apply your brand colors, upload a logo, choose eye shapes and patterns. Make it unmistakably yours.',
  icon: Palette
},
{
  number: '03',
  title: 'Deploy',
  subtitle: 'Track & Manage',
  description: 'Launch your code and watch real-time analytics roll in. Update dynamic codes anytime without reprinting.',
  icon: BarChart3
}];


export default function PathToMastery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-[5vw] bg-background" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-3">HOW IT WORKS</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">Create, Design, Deploy in Minutes</h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
                className="relative z-10 bg-card border border-border rounded-xl p-5 sm:p-7 hover:scale-105 transition-transform duration-300 hover:shadow-card-hover">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-3xl font-black text-primary/20 leading-none">{step.number}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground mb-1">{step.title}</h3>
                <p className="text-xs sm:text-sm font-semibold text-primary mb-3">{step.subtitle}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>);

          })}
        </div>
      </div>
    </section>);

}