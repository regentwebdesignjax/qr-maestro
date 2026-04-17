import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <article className="prose prose-sm max-w-none font-poppins">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#142024' }}>
              The Guardian's Vow: Privacy Policy
            </h1>
            <p className="text-gray-500 italic">Last Updated: April 17, 2026</p>
          </div>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              The Dojo's Commitment to Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the Dojo, trust is the foundation of every strike. QR Sensei ("we," "us," or "our") is committed to protecting the privacy and security of our students. This "Guardian's Vow" outlines how we collect, use, and protect your information when you use our QR code services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              1. Information We Collect
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">Personal Identity:</span>
                <span>When you join the Dojo, we collect your name and email address to manage your account and subscription rank.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">QR Content:</span>
                <span>We store the URLs, text, or files you provide to generate your QR codes.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">Scan Metadata (Inner Vision):</span>
                <span>For Dynamic QR codes, we collect non-identifying metadata from scanners, including IP addresses (for geo-location), device types, and browser information.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              2. How We Use Your Data
            </h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>To provide and maintain our QR generation and tracking services.</li>
              <li>To calculate scan analytics for your dashboard.</li>
              <li>To process payments through our secure third-party partner, Stripe.</li>
              <li>
                To provide support and illumination via{' '}
                <a
                  href="mailto:qrsensei@regentmediagroup.com"
                  style={{ color: '#BB3F27' }}
                  className="font-medium hover:opacity-80"
                >
                  qrsensei@regentmediagroup.com
                </a>
                .
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              3. Third-Party Discipline
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">Service Providers:</span>
                <span>We share necessary data with trusted partners (Stripe for billing, ip-api for geo-location).</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">No Sale of Data:</span>
                <span>We do not sell, trade, or rent your personal information to third parties.</span>
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              4. Data Security & Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We employ enterprise-grade security to protect your information. We retain your data <span className="font-semibold">until account deletion</span>. Once you choose to leave the Dojo and delete your account, your data will be permanently removed from our active scrolls.
            </p>
          </section>

          {/* Back Link */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <Link
              to="/"
              style={{ color: '#BB3F27' }}
              className="font-medium hover:opacity-80 transition-opacity"
            >
              ← Back to Home
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}