import { useEffect } from 'react';

const PAGE_META = {
  Home: {
    title: 'QR Sensei | Professional QR Code Generator & Digital Business Cards',
    description: 'Create dynamic QR codes, digital business cards, and capture leads — all in one platform. Trusted by teams in Jacksonville, FL and beyond.',
  },
  Pricing: {
    title: 'Digital Business Cards for Teams | 10 Free Cards | QR Sensei',
    description: 'Get 10 free Digital Business Cards with every Black Belt plan. Dynamic QR codes, real-time analytics, and lead capture starting at $29/month.',
  },
  Leads: {
    title: 'Lead Management & CRM Integration | QR Sensei',
    description: 'View, export, and manage every lead captured through your Digital Business Cards. Filter duplicates and export to CSV for CRM integration.',
  },
  Dashboard: {
    title: 'The Dojo | QR Sensei',
    description: 'Manage your QR code disciplines, track scan analytics, and oversee your digital business cards.',
  },
  MyQRCodes: {
    title: 'My QR Codes | QR Sensei',
    description: 'View and manage all your QR codes, organize by folder, and track performance.',
  },
  CreateQR: {
    title: 'Create QR Code | QR Sensei - Master the Art of QR',
    description: 'Generate static or dynamic QR codes for URLs, WiFi, vCards, Digital Business Cards, and more.',
  },
  EditQR: {
    title: 'Edit QR Code | QR Sensei - Master the Art of QR',
    description: 'Update your dynamic QR code content without reprinting.',
  },
  Analytics: {
    title: 'Scan Analytics | QR Sensei - Master the Art of QR',
    description: 'Real-time scan analytics including location, device, and time-of-day insights.',
  },
  FAQ: {
    title: 'FAQ | QR Sensei - Master the Art of QR',
    description: 'Frequently asked questions about QR Sensei, dynamic QR codes, and digital business cards.',
  },
  WhyUs: {
    title: 'Why QR Sensei? | Master the Art of QR',
    description: 'Discover why QR Sensei is the top choice for dynamic QR codes and digital business cards.',
  },
};

const DEFAULT_META = {
  title: 'QR Sensei - Master the Art of QR',
  description: 'Professional QR code generation and digital business card platform for individuals and teams.',
};

export function usePageMeta(pageName) {
  useEffect(() => {
    const meta = PAGE_META[pageName] || DEFAULT_META;

    document.title = meta.title;

    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);
  }, [pageName]);
}