import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHours, getDay } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h) {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export default function TimeOfDayHeatmap({ scans }) {
  // Build a 7x24 grid: grid[day][hour] = count
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));

  scans.forEach(scan => {
    const date = new Date(scan.created_date);
    const day = getDay(date);   // 0 = Sun
    const hour = getHours(date);
    grid[day][hour]++;
  });

  const maxVal = Math.max(...grid.flat(), 1);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / maxVal;
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-700';
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Activity by Time of Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.map(h => (
                <div key={h} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                  {h % 3 === 0 ? formatHour(h) : ''}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center mb-0.5">
                <div className="w-10 text-xs text-gray-500 font-medium shrink-0">{day}</div>
                {HOURS.map(hour => {
                  const count = grid[dayIdx][hour];
                  return (
                    <div
                      key={hour}
                      className={`flex-1 aspect-square rounded-sm mx-px ${getColor(count)} transition-colors`}
                      title={`${day} ${formatHour(hour)}: ${count} scan${count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs text-gray-400">Less</span>
              {['bg-gray-100', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500', 'bg-blue-700'].map(c => (
                <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
              ))}
              <span className="text-xs text-gray-400">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}