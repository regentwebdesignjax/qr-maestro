import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';

export default function HubSpotConnectBanner({ connected, onConnectionChange }) {
  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(HUBSPOT_CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        onConnectionChange();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(HUBSPOT_CONNECTOR_ID);
    onConnectionChange();
  };

  if (connected) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-800">HubSpot Connected</span>
          <span className="text-xs text-green-600">— Leads can be synced to your HubSpot CRM</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-xs border-green-300 text-green-700 hover:bg-green-100">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 mb-6">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
        <span className="text-sm font-medium text-orange-800">HubSpot Not Connected</span>
        <span className="text-xs text-orange-600 hidden sm:inline">— Connect to sync leads directly to your CRM</span>
      </div>
      <Button size="sm" onClick={handleConnect} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
        Connect HubSpot
      </Button>
    </div>
  );
}