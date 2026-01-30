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
      answer: 'A QR code (Quick Response code) is a two-dimensional barcode that can store information like URLs, text, WiFi credentials, and contact information. It can be scanned using a smartphone camera to quickly access the encoded data.'
    },
    {
      question: 'What\'s the difference between static and dynamic QR codes?',
      answer: 'Static QR codes contain fixed information that cannot be changed after creation. Dynamic QR codes use a short URL that redirects to your content, allowing you to update the destination URL or content anytime without reprinting the QR code.'
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
      question: 'What\'s included in the free plan?',
      answer: 'The free plan includes up to 3 static QR codes with basic customization. You can create URL, text, WiFi, and vCard QR codes. To access dynamic QR codes and analytics, upgrade to Pro.'
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
      answer: 'No, QR codes do not expire. Static QR codes will work forever. Dynamic QR codes will work as long as your account is active and the QR code hasn\'t been deleted.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about our QR code platform. Can't find what you're looking for? Contact our support team.
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
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
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
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Our support team is here to help. Get started today or reach out if you need assistance.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/Dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
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