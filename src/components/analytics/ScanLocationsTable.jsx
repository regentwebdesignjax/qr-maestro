import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScanLocationsTable({ scans }) {
  const [groupBy, setGroupBy] = useState('state');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Aggregate scans by the selected grouping
  const aggregatedData = useMemo(() => {
    const grouped = scans.reduce((acc, scan) => {
      let key, location;

      if (groupBy === 'city') {
        key = [scan.city, scan.state, scan.country].filter(Boolean).join('|') || 'Unknown';
        location = { city: scan.city, state: scan.state, country: scan.country };
      } else if (groupBy === 'country') {
        key = scan.country || 'Unknown';
        location = { city: null, state: null, country: scan.country };
      } else {
        // Default to state
        key = [scan.state, scan.country].filter(Boolean).join('|') || 'Unknown';
        location = { city: null, state: scan.state, country: scan.country };
      }

      if (!acc[key]) {
        acc[key] = { ...location, scans: 0 };
      }
      acc[key].scans += 1;
      return acc;
    }, {});

    // Convert to array and sort by scans descending
    return Object.values(grouped).sort((a, b) => b.scans - a.scans);
  }, [scans, groupBy]);

  // Calculate pagination
  const totalResults = aggregatedData.length;
  const totalPages = Math.ceil(totalResults / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = aggregatedData.slice(startIndex, startIndex + rowsPerPage);

  // Calculate percentages
  const totalScans = aggregatedData.reduce((sum, item) => sum + item.scans, 0);
  const dataWithPercentages = paginatedData.map(item => ({
    ...item,
    percentage: ((item.scans / totalScans) * 100).toFixed(1),
  }));

  const handleGroupByChange = (value) => {
    setGroupBy(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (aggregatedData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-primary" />
            Scan Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No location data yet — locations are captured when the QR code is scanned.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-primary" />
            Scan Locations
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Scans by</span>
            <Select value={groupBy} onValueChange={handleGroupByChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="country">Country</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">
                  {groupBy === 'city' ? 'CITY' : groupBy === 'country' ? 'COUNTRY' : 'STATE/PROVINCE'}
                </th>
                {groupBy === 'city' && (
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">
                    STATE/PROVINCE
                  </th>
                )}
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs">
                  COUNTRY
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs">
                  SCANS
                </th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs">
                  % OF SCANS
                </th>
              </tr>
            </thead>
            <tbody>
              {dataWithPercentages.map((item, i) => (
                <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-foreground">
                    {item.city || item.state || item.country || 'Unknown'}
                  </td>
                  {groupBy === 'city' && (
                    <td className="py-3 px-4 text-foreground">
                      {item.state || '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-foreground">
                    {item.country || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    {item.scans}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {item.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalResults)} of {totalResults} results
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="w-[70px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
