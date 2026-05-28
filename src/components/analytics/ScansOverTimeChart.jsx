import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInDays, format } from 'date-fns';

export default function ScansOverTimeChart({ scans, dateRange }) {
  const [chartType, setChartType] = useState('bar');
  const { from, to } = dateRange;

  const chartData = useMemo(() => {
    const daysDiff = differenceInDays(to, from);

    // Group by month if range > 90 days, by week if > 30 days, else by day
    const getGroupKey = (date) => {
      if (daysDiff > 90) return format(date, 'MMM yyyy');
      if (daysDiff > 30) return format(date, 'MMM d'); // week start label via grouping below
      return format(date, 'MMM d');
    };

    const grouped = {};

    scans.forEach(s => {
      if (!s.created_date) return;
      const raw = s.created_date.endsWith('Z') ? s.created_date : s.created_date + 'Z';
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      if (d < from || d > to) return;

      let key;
      if (daysDiff > 90) {
        key = format(d, 'yyyy-MM'); // sort key
      } else if (daysDiff > 30) {
        // group by week: find week start (Monday)
        const day = d.getDay(); // 0=Sun
        const diff = (day === 0 ? -6 : 1 - day);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        key = format(weekStart, 'yyyy-MM-dd');
      } else {
        key = format(d, 'yyyy-MM-dd');
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    // If no scans at all, build a minimal skeleton from the range
    if (Object.keys(grouped).length === 0) {
      if (daysDiff > 90) {
        // Show month buckets for the visible range
        const cur = new Date(from.getFullYear(), from.getMonth(), 1);
        const end = new Date(to.getFullYear(), to.getMonth(), 1);
        while (cur <= end) {
          grouped[format(cur, 'yyyy-MM')] = 0;
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        let label;
        if (daysDiff > 90) {
          // key = 'yyyy-MM'
          const [y, m] = key.split('-');
          label = format(new Date(Number(y), Number(m) - 1, 1), 'MMM yyyy');
        } else if (daysDiff > 30) {
          // key = 'yyyy-MM-dd' (week start)
          label = format(new Date(key + 'T00:00:00'), 'MMM d');
        } else {
          label = format(new Date(key + 'T00:00:00'), daysDiff <= 7 ? 'EEE MMM d' : 'MMM d');
        }
        return { date: label, scans: count };
      });
  }, [scans, from, to]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Scans Over Time</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar Chart
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line Chart
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="scans" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="scans"
                stroke="#BB3F27"
                strokeWidth={2}
                dot={{ fill: '#BB3F27', r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}