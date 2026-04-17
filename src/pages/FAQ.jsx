import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const faqs = [
    {
      question: 'What is a QR code?',
      answer: 'A QR code is a digital gateway - a two-dimensional symbol that holds information like URLs, text, WiFi credentials, and contact details. When scanned by a device, it opens pathways to your content.'
    },
    {
      question: 'What\'s the difference between The Swift Strike and The Fluid Form?',
      answer: 'The Swift Strike (static) is fixed and unyielding - unchanging after creation. The Fluid Form (dynamic) is adaptable like water - redirecting through our gateway, allowing you to change your content anytime without reprinting.'
    },
    {
      question: 'Can I customize my QR codes?',
      answer: 'Yes! You can customize your QR codes with different foreground and background colors, and even add your logo to make them match your brand identity.'
    },
    {
      question: 'How do I track QR code scans?',
      answer: 'Pro subscribers get access to detailed analytics for their QR codes, including scan counts, locations, device types, and time-based data. This helps you understand how your QR codes are performing.'
    },
    {
      question: 'What\'s included in the White Belt Rank?',
      answer: 'The White Belt Rank grants you 3 Swift Strikes with foundational customization. Create codes for URLs, text, WiFi, and vCards. To unlock The Fluid Form and Inner Vision, ascend to Black Belt.'
    },
    {
      question: 'Can I download my QR codes?',
      answer: 'Absolutely! You can download your QR codes in both PNG and SVG formats for print and digital use.'
    },
    {
      question: 'How do dynamic QR codes work?',
      answer: 'Dynamic QR codes redirect through a short URL that we manage. When someone scans the code, they\'re redirected to your target URL. You can change this target URL anytime from your dashboard without reprinting the QR code.'
    },
    {
      question: 'Is there a limit to how many times my QR code can be scanned?',
      answer: 'No! All QR codes can be scanned unlimited times. We don\'t impose any scan limits on any plan.'
    },
    {
      question: 'Can I edit my QR codes after creating them?',
      answer: 'Yes, but only dynamic QR codes can be edited. Static QR codes contain fixed information and cannot be changed. This is why dynamic QR codes are so valuable for campaigns and marketing materials.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! You can cancel your Pro subscription at any time from your account settings. Your QR codes will continue to work, but you\'ll lose access to Pro features like analytics and dynamic QR codes.'
    },
    {
      question: 'Do QR codes expire?',
      answer: 'No, a Sensei\'s work is timeless. Your QR codes endure indefinitely. Static Strikes remain eternal. Dynamic codes persist as long as your account stands and the code remains undeleted.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
             The Scroll of Wisdom
           </h1>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
             In these sacred scrolls lie answers to the questions of seekers. Should mystery remain, 
             reach out to our guides for illumination.
           </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto mb-16">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
             The Path Unclear?
           </h2>
           <p className="text-gray-600 mb-8">
             Our guides stand ready to illuminate your way. Begin your journey today, or seek 
             the counsel of our support sages.
           </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg">
                Get Started Free
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