import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, User, FileText, Share2, Tag, Image, Music, Phone } from 'lucide-react';

function parseWifi(content) {
  const lines = content.split('\n');
  const result = {};
  lines.forEach(line => {
    const [key, ...rest] = line.split(':');
    result[key?.trim().toLowerCase()] = rest.join(':').trim();
  });
  return result;
}

function parseVCard(content) {
  const lines = content.split('\n');
  const result = {};
  lines.forEach(line => {
    const [key, ...rest] = line.split(':');
    result[key?.trim().toLowerCase()] = rest.join(':').trim();
  });
  return result;
}

function WifiDisplay({ content }) {
  const wifi = parseWifi(content);
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Wifi className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>WiFi Network</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {wifi.ssid && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Network Name</p>
            <p className="text-lg font-semibold">{wifi.ssid}</p>
          </div>
        )}
        {wifi.password && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Password</p>
            <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">{wifi.password}</p>
          </div>
        )}
        {wifi.encryption && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Security</p>
            <p className="font-medium">{wifi.encryption}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 pt-2">Go to Settings → WiFi to connect manually</p>
      </CardContent>
    </Card>
  );
}

function VCardDisplay({ content }) {
  const vc = parseVCard(content);
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle>Contact Info</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {vc.name && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Name</p>
            <p className="text-lg font-semibold">{vc.name}</p>
          </div>
        )}
        {vc.phone && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
            <a href={`tel:${vc.phone}`} className="text-blue-600 font-medium">{vc.phone}</a>
          </div>
        )}
        {vc.email && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
            <a href={`mailto:${vc.email}`} className="text-blue-600 font-medium">{vc.email}</a>
          </div>
        )}
        {vc.company && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Company</p>
            <p className="font-medium">{vc.company}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TextDisplay({ content, name }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>{name || 'Message'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}

function PDFDisplay({ content, name }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-lg">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>PDF Document</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <a href={content} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90">
          Open PDF
        </a>
      </CardContent>
    </Card>
  );
}

function SocialDisplay({ content }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Social Media</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {content.split('\n').map((line, idx) => {
          if (!line.trim()) return null;
          const [platform, handle] = line.split(':').map(s => s.trim());
          return (
            <div key={idx} className="text-sm">
              <p className="text-gray-500 font-medium">{platform}</p>
              <p className="text-gray-700">{handle}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CouponDisplay({ content }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Tag className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle>Coupon Code</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Use code</p>
          <p className="text-4xl font-bold text-primary">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageDisplay({ content }) {
  return (
    <Card className="max-w-md w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Image className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle>Image</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <img src={content} alt="Shared" className="w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function MP3Display({ content }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Music className="w-6 h-6 text-indigo-600" />
          </div>
          <CardTitle>Audio</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio controls className="w-full">
          <source src={content} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
}

function CallDisplay({ content }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Call</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-600 mb-3">Tap to call</p>
        <a href={`tel:${content}`} className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90">
          {content}
        </a>
      </CardContent>
    </Card>
  );
}

export default function Redirect() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        window.location.href = '/';
        return;
      }

      try {
        const response = await base44.functions.invoke('redirect', { code });
        const data = response?.data;

        if (!data) { window.location.href = '/'; return; }

        if (data.content_type === 'url') {
          window.location.href = data.url;
          return;
        }

        setState({ status: 'display', data });
      } catch (error) {
        console.error('Redirect error:', error);
        window.location.href = '/';
      }
    };

    run();
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      {data.content_type === 'wifi' && <WifiDisplay content={data.content} />}
      {data.content_type === 'vcard' && <VCardDisplay content={data.content} />}
      {data.content_type === 'text' && <TextDisplay content={data.content} name={data.name} />}
      {data.content_type === 'pdf' && <PDFDisplay content={data.content} name={data.name} />}
      {data.content_type === 'social' && <SocialDisplay content={data.content} />}
      {data.content_type === 'coupon' && <CouponDisplay content={data.content} />}
      {data.content_type === 'image' && <ImageDisplay content={data.content} />}
      {data.content_type === 'mp3' && <MP3Display content={data.content} />}
      {data.content_type === 'call' && <CallDisplay content={data.content} />}
    </div>
  );
}