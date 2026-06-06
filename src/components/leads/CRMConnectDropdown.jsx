import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Link2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';
const SALESFORCE_CONNECTOR_ID = '6a24a2f7fcbdaaac31c6338d';

export default function CRMConnectDropdown({ hubspotConnected, salesforceConnected, onConnectionChange }) {
  const [open, setOpen] = useState(false);
  const [loadingCrm, setLoadingCrm] = useState(null);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const connectCRM = async (crm) => {
    setLoadingCrm(crm);
    setOpen(false);
    const connectorId = crm === 'hubspot' ? HUBSPOT_CONNECTOR_ID : SALESFORCE_CONNECTOR_ID;
    const url = await base44.connectors.connectAppUser(connectorId);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setLoadingCrm(null);
        onConnectionChange();
      }
    }, 500);
  };

  const disconnectCRM = async (crm) => {
    setLoadingCrm(crm);
    setOpen(false);
    const connectorId = crm === 'hubspot' ? HUBSPOT_CONNECTOR_ID : SALESFORCE_CONNECTOR_ID;
    await base44.connectors.disconnectAppUser(connectorId);
    setLoadingCrm(null);
    onConnectionChange();
  };

  const anyConnected = hubspotConnected || salesforceConnected;
  const bothConnected = hubspotConnected && salesforceConnected;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        {anyConnected ? 'CRM Connected' : 'Connect to CRM'}
        {/* Status dot on main button */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${bothConnected ? 'bg-green-500' : anyConnected ? 'bg-yellow-400' : 'bg-red-400'}`} />
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* HubSpot — full row is clickable */}
          <button
            className="w-full px-4 py-3 border-b flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => hubspotConnected ? disconnectCRM('hubspot') : connectCRM('hubspot')}
            disabled={!!loadingCrm}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${hubspotConnected ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-gray-800">HubSpot</span>
            </div>
            <span className={`text-xs font-medium ${hubspotConnected ? 'text-red-500' : 'text-primary'}`}>
              {loadingCrm === 'hubspot' ? (hubspotConnected ? 'Disconnecting...' : 'Connecting...') : hubspotConnected ? 'Disconnect' : 'Connect'}
            </span>
          </button>

          {/* Salesforce — full row is clickable */}
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => salesforceConnected ? disconnectCRM('salesforce') : connectCRM('salesforce')}
            disabled={!!loadingCrm}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${salesforceConnected ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-gray-800">Salesforce</span>
            </div>
            <span className={`text-xs font-medium ${salesforceConnected ? 'text-red-500' : 'text-primary'}`}>
              {loadingCrm === 'salesforce' ? (salesforceConnected ? 'Disconnecting...' : 'Connecting...') : salesforceConnected ? 'Disconnect' : 'Connect'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}