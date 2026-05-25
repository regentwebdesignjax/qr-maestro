import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { eachDayOfInterval, format } from 'date-fns';

export default function ScansOverTimeChart({ scans, dateRange }) {
  const [chartType, setChartType] = useState('bar');
  const { from, to } = dateRange;

  const days = eachDayOfInterval({ start: from, end: to });

  const chartData = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = scans.filter(s => {
      const raw = s.created_date.endsWith('Z') ? s.created_date : s.created_date + 'Z';
      return format(new Date(raw), 'yyyy-MM-dd') === dateStr;
    }).length;
    return { date: format(day, days.length > 14 ? 'MMM d' : 'MMM dd'), scans: count };
  });

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