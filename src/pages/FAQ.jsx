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
      answer: 'A QR code (Quick Response code) is a two-dimensional barcode that stores digital information like URLs, text, WiFi credentials, and contact information. It is designed to be scanned instantly using a smartphone camera.'
    },
    {
      question: 'What is the difference between static and dynamic QR codes?',
      answer: 'Static QR codes contain fixed information that cannot be changed after creation. Dynamic QR codes allow you to update the destination URL or content at any time without having to reprint the physical QR code.'
    },
    {
      question: 'Can I customize my QR codes?',
      answer: 'Yes. You can fully customize your codes by changing the foreground and background colors, choosing different pattern styles and eye shapes, and uploading your company logo to the center of the code.'
    },
    {
      question: 'How do I track QR code scans?',
      answer: 'Users on the Black Belt (Pro) plan have access to detailed scan analytics through their dashboard, including total scan counts, geographical locations, and the types of devices used by scanners.'
    },
    {
      question: 'What is included in the White Belt Rank?',
      answer: 'The White Belt (Free) rank allows you to create up to 3 static QR codes with basic customization and high-resolution PNG downloads. It is perfect for testing the fundamentals of our service.'
    },
    {
      question: 'Can I download my QR codes?',
      answer: 'Yes. All QR codes can be downloaded as high-resolution PNG files, which are suitable for both high-quality digital displays and professional physical printing.'
    },
    {
      question: 'How do dynamic QR codes work?',
      answer: 'Dynamic codes use a redirection link. When someone scans the code, they are briefly sent to our secure server which then instantly forwards them to your chosen destination. This is what allows you to change the destination URL without changing the QR image.'
    },
    {
      question: 'Is there a limit to how many times my QR code can be scanned?',
      answer: 'No. QR Sensei provides unlimited scans on all plans. Your codes will remain accessible to your customers regardless of how many times they are scanned.'
    },
    {
      question: 'Can I edit my QR codes after creating them?',
      answer: 'Only Dynamic QR codes can be edited. Because Static QR codes have the information hard-coded into the pattern itself, they cannot be changed once generated.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards including Visa, Mastercard, and American Express through our secure Stripe payment processor.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes. You can manage or cancel your subscription at any time through your account settings. If you cancel, your Pro features will remain active until the end of your current billing period.'
    },
    {
      question: 'Do QR codes expire?',
      answer: 'No. Static QR codes work indefinitely. Dynamic QR codes remain active as long as your account is in good standing and the code has not been deleted from your dashboard.'
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
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors duration-200">
                Get Started Free
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