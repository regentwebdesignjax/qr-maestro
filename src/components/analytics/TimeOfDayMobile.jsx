import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { getHours } from 'date-fns';

function formatHour(h) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export default function TimeOfDayMobile({ scans }) {
  const hourCounts = useMemo(() => {
    const counts = Array(24).fill(0);
    scans.forEach(scan => {
      if (!scan.created_date) return;
      const raw = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
      const date = new Date(raw);
      if (!isNaN(date.getTime())) counts[getHours(date)]++;
    });
    return counts;
  }, [scans]);

  const topHours = useMemo(() => {
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [hourCounts]);

  const maxCount = topHours[0]?.count || 1;

  if (scans.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Peak Scan Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">No scan data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Peak Scan Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">Top 5 most active hours</p>
        <div className="space-y-3">
          {topHours.map(({ hour, count }, idx) => {
            const pct = Math.round((count / maxCount) * 100);
            const isTop = idx === 0;
            return (
              <div key={hour}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    {isTop && <span className="text-xs bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">Peak</span>}
                    <span className="font-medium text-gray-700">{formatHour(hour)}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{count} scan{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%`, opacity: isTop ? 1 : 0.5 + (0.5 * (1 - idx * 0.15)) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}