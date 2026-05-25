import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHours, getDay } from 'date-fns';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function getHeatmapColor(intensity) {
  if (intensity === 0) {
    return 'rgba(249, 250, 251, 1)'; // Light gray
  }

  // Interpolate from light red to deep crimson
  const startR = 0.95, startG = 0.90, startB = 0.88;
  const endR = 0.733, endG = 0.247, endB = 0.153;

  const r = startR + (endR - startR) * intensity;
  const g = startG + (endG - startG) * intensity;
  const b = startB + (endB - startB) * intensity;

  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
}

export default function TimeOfDayHeatmap({ scans }) {
  // Build a 7x24 grid: grid[dayOfWeek][hour] = count
  // dayOfWeek: 0=Mon, 1=Tue, ..., 6=Sun
  const grid = useMemo(() => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    scans.forEach(scan => {
      if (!scan.created_date) return;

      const raw = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
      const date = new Date(raw);

      if (isNaN(date.getTime())) return;

      const dayOfWeek = getDay(date);
      const hour = getHours(date);

      // Convert Sunday (0) to Saturday (6) to Monday (0) to Sunday (6)
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      heatmap[adjustedDay][hour]++;
    });

    return heatmap;
  }, [scans]);

  const maxVal = useMemo(() => Math.max(...grid.flat(), 1), [grid]);

  // Invert hours for display: 11pm at top, 12am at bottom
  const invertedHours = [...HOURS].reverse();

  if (scans.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Scans by Time of Day</CardTitle>
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
        <CardTitle className="text-base font-semibold">Scans by Time of Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 w-full">
          {/* Hours labels (left side) */}
          <div className="flex flex-col justify-between flex-shrink-0" style={{ width: '45px', height: '480px' }}>
            {invertedHours.map(h => (
              <div key={h} className="text-xs text-muted-foreground text-right h-4 leading-4">
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 flex-1">
            {DAYS_OF_WEEK.map((day, dayIdx) => (
              <div key={day} className="flex flex-col gap-1 flex-1">
                {/* Grid cells for this day (inverted: top to bottom) */}
                {invertedHours.map(h => {
                  const count = grid[dayIdx][h];
                  const intensity = count / maxVal;

                  return (
                    <div
                      key={`${day}-${h}`}
                      className="w-full h-4 rounded-sm transition-colors"
                      style={{ backgroundColor: getHeatmapColor(intensity) }}
                      title={`${day} ${formatHour(h)}: ${count} scan${count !== 1 ? 's' : ''}`}
                    />
                  );
                })}

                {/* Day label below grid */}
                <div className="text-xs font-medium text-muted-foreground text-center mt-1">
                  {day}
                </div>
              </div>
            ))}
          </div>

          {/* Intensity gradient scale */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="text-xs text-muted-foreground font-medium mb-2">Scans</div>
            <div className="relative inline-block" style={{ width: '36px', height: '480px' }}>
              <div
                className="rounded-sm"
                style={{
                  width: '18px',
                  height: '480px',
                  background: 'linear-gradient(to bottom, rgba(187, 63, 39, 1), rgba(249, 250, 251, 1))',
                }}
              />
              <div
                className="absolute text-xs text-muted-foreground font-medium"
                style={{
                  right: 0,
                  top: '-6px',
                  width: '18px',
                  textAlign: 'center',
                }}
              >
                {maxVal}
              </div>
              <div
                className="absolute text-xs text-muted-foreground font-medium"
                style={{
                  right: 0,
                  bottom: '-6px',
                  width: '18px',
                  textAlign: 'center',
                }}
              >
                0
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}