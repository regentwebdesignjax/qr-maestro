import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, BarChart3, ExternalLink } from 'lucide-react';
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