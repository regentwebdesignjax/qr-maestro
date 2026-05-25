import React from 'react';
import BusinessPageLanding from '@/pages/BusinessPageLanding';

export default function BusinessPagePreview({ data = {} }) {
  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600"></div>
        </div>

        {/* Card content */}
        <div className="overflow-y-auto max-h-[520px] bg-gray-50">
          <BusinessPageLanding data={data} fullPage={false} />
        </div>

        {/* Home indicator */}
        <div className="bg-gray-800 h-6 flex items-end justify-center pb-1.5">
          <div className="w-12 h-1 rounded-full bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
}
