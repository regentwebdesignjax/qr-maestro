import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, BarChart3, ExternalLink, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function QRCodeList({ qrCodes, isPro, onDelete }) {
  // isPro already includes admin check from parent component
  const formatContentType = (type) => {
    const types = {
      url: 'URL',
      text: 'Text',
      wifi: 'WiFi',
      vcard: 'vCard'
    };
    return types[type] || type;
  };

  const handleDownload = async (qr) => {
    const QRCode = (await import('qrcode')).default;
    
    // Generate QR code content
    let content = qr.content;
    if (qr.type === 'dynamic' && qr.short_code) {
      content = `${window.location.origin}/r/${qr.short_code}`;
    }

    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(content, {
      width: 1024,
      margin: 2,
      color: {
        dark: qr.design_config?.foreground_color || '#000000',
        light: qr.design_config?.background_color || '#FFFFFF',
      }
    });

    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${qr.name.replace(/[^a-z0-9]/gi, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Content Type</TableHead>
            <TableHead>Scans</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {qrCodes.map((qr) => (
            <TableRow key={qr.id}>
              <TableCell className="font-medium">{qr.name}</TableCell>
              <TableCell>
                <Badge variant={qr.type === 'dynamic' ? 'default' : 'secondary'}>
                  {qr.type === 'static' ? 'Static' : 'Dynamic'}
                </Badge>
              </TableCell>
              <TableCell>{formatContentType(qr.content_type)}</TableCell>
              <TableCell>
                {qr.type === 'static' ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="italic text-gray-400 text-sm">Untrackable</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Static QR codes cannot be tracked. Upgrade to Pro to create dynamic, trackable codes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{qr.scan_count || 0}</span>
                    {isPro && (
                      <Link to={'/Analytics?id=' + qr.id}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <BarChart3 className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-gray-600">
                {format(new Date(qr.created_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {qr.type === 'dynamic' && (
                    <Link to={'/EditQR?id=' + qr.id}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Link to={'/ViewQR?id=' + qr.id}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownload(qr)}
                    title="Download QR Code"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this QR code?')) {
                        onDelete(qr.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}