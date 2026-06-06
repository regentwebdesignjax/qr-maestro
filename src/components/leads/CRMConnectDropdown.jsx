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

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        {anyConnected ? 'CRM Connected' : 'Connect to CRM'}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* HubSpot */}
          <div className="px-3 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">HubSpot</span>
                {hubspotConnected && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Connected</span>
                )}
              </div>
              {hubspotConnected ? (
                <button
                  onClick={() => disconnectCRM('hubspot')}
                  disabled={loadingCrm === 'hubspot'}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {loadingCrm === 'hubspot' ? '...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => connectCRM('hubspot')}
                  disabled={!!loadingCrm}
                  className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  {loadingCrm === 'hubspot' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>

          {/* Salesforce */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">Salesforce</span>
                {salesforceConnected && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Connected</span>
                )}
              </div>
              {salesforceConnected ? (
                <button
                  onClick={() => disconnectCRM('salesforce')}
                  disabled={loadingCrm === 'salesforce'}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {loadingCrm === 'salesforce' ? '...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => connectCRM('salesforce')}
                  disabled={!!loadingCrm}
                  className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  {loadingCrm === 'salesforce' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}