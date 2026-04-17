import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <article className="prose prose-sm max-w-none font-poppins">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#142024' }}>
              The Code of Conduct: Terms of Service
            </h1>
            <p className="text-gray-500 italic">Effective Date: April 17, 2026</p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              Entering the Dojo
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing QR Sensei, you agree to follow the "Code of Conduct" outlined below. Every student of the scan must act with integrity to maintain the harmony of our service.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              1. Account Responsibility & Ranks
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="min-w-fit">•</span>
                <span>You are responsible for the security of your account and all activity that occurs under your Belt Rank.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">White Belt (Free):</span>
                <span>Limited to the creation of 3 Static QR codes.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold min-w-fit">Black Belt (Pro):</span>
                <span>Grants access to unlimited QR codes, Dynamic editing, and Inner Vision analytics for the duration of the subscription.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              2. Prohibited Strikes (Acceptable Use)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Dojo must remain a place of honor. You may not use our services for:
            </p>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Phishing, malware distribution, or deceptive practices.</li>
              <li>Interfering with the "Speed of the Cobra" (server performance) through automated attacks.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              3. Payments & Mastery
            </h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Subscriptions are managed via Stripe. Fees are billed in advance and are non-refundable.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              4. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These terms and your use of the Dojo are governed by and construed in accordance with the laws of the <span className="font-semibold">State of Florida</span>.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#142024' }}>
              5. Termination & Inquiries
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to dismiss any account from the Dojo that violates this code. Direct all legal inquiries to{' '}
              <a
                href="mailto:qrsensei@regentmediagroup.com"
                style={{ color: '#BB3F27' }}
                className="font-medium hover:opacity-80"
              >
                qrsensei@regentmediagroup.com
              </a>
              .
            </p>
          </section>

          {/* Back Link */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <Link
              to="/"
              style={{ color: '#BB3F27' }}
              className="font-medium hover:opacity-80 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}