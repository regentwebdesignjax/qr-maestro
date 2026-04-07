import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { eachDayOfInterval, format } from 'date-fns';

export default function ScansOverTimeChart({ scans, dateRange }) {
  const { from, to } = dateRange;

  const days = eachDayOfInterval({ start: from, end: to });

  const chartData = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = scans.filter(s => format(new Date(s.created_date), 'yyyy-MM-dd') === dateStr).length;
    return { date: format(day, days.length > 14 ? 'MMM d' : 'MMM dd'), scans: count };
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Scans Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="scans" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}