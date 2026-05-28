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

    // Bucketing strategy:
    // ≤ 60 days  → daily   (every day in range shown, even zeros)
    // 61–90 days → weekly  (Monday-anchored week buckets)
    // > 90 days  → monthly

    if (daysDiff > 90) {
      // Monthly buckets
      const grouped = {};
      scans.forEach(s => {
        if (!s.created_date) return;
        const raw = s.created_date.endsWith('Z') ? s.created_date : s.created_date + 'Z';
        const d = new Date(raw);
        if (isNaN(d.getTime()) || d < from || d > to) return;
        const key = format(d, 'yyyy-MM');
        grouped[key] = (grouped[key] || 0) + 1;
      });

      // Fill all months in range with 0 if missing
      const cur = new Date(from.getFullYear(), from.getMonth(), 1);
      const end = new Date(to.getFullYear(), to.getMonth(), 1);
      while (cur <= end) {
        const key = format(cur, 'yyyy-MM');
        if (!(key in grouped)) grouped[key] = 0;
        cur.setMonth(cur.getMonth() + 1);
      }

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => {
          const [y, m] = key.split('-');
          return { date: format(new Date(Number(y), Number(m) - 1, 1), 'MMM yyyy'), scans: count };
        });

    } else if (daysDiff > 60) {
      // Weekly buckets (Monday-anchored)
      const grouped = {};
      scans.forEach(s => {
        if (!s.created_date) return;
        const raw = s.created_date.endsWith('Z') ? s.created_date : s.created_date + 'Z';
        const d = new Date(raw);
        if (isNaN(d.getTime()) || d < from || d > to) return;
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() + diff);
        const key = format(weekStart, 'yyyy-MM-dd');
        grouped[key] = (grouped[key] || 0) + 1;
      });

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => ({
          date: format(new Date(key + 'T00:00:00'), 'MMM d'),
          scans: count,
        }));

    } else {
      // Daily buckets — show EVERY day in range, including zeros
      const grouped = {};
      // Pre-fill all days with 0
      const cur = new Date(from);
      while (cur <= to) {
        grouped[format(cur, 'yyyy-MM-dd')] = 0;
        cur.setDate(cur.getDate() + 1);
      }
      // Count scans per day
      scans.forEach(s => {
        if (!s.created_date) return;
        const raw = s.created_date.endsWith('Z') ? s.created_date : s.created_date + 'Z';
        const d = new Date(raw);
        if (isNaN(d.getTime()) || d < from || d > to) return;
        const key = format(d, 'yyyy-MM-dd');
        if (key in grouped) grouped[key] += 1;
      });

      const labelFmt = daysDiff <= 7 ? 'EEE MMM d' : 'MMM d';
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => ({
          date: format(new Date(key + 'T00:00:00'), labelFmt),
          scans: count,
        }));
    }
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