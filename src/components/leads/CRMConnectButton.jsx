import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, ChevronDown, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';
const SALESFORCE_CONNECTOR_ID = '68e14191f0b0a5a83d54d9b5';

export default function CRMConnectButton({ hubspotConnected, salesforceConnected, onConnectionChange }) {
  const [isLoading, setIsLoading] = useState(null); // 'hubspot' | 'salesforce' | null
  const [disconnectTarget, setDisconnectTarget] = useState(null); // 'hubspot' | 'salesforce' | null
  const [errorMsg, setErrorMsg] = useState(null);

  const handleConnect = async (crm) => {
    setIsLoading(crm);
    setErrorMsg(null);
    try {
      const connectorId = crm === 'hubspot' ? HUBSPOT_CONNECTOR_ID : SALESFORCE_CONNECTOR_ID;
      const url = await base44.connectors.connectAppUser(connectorId);
      // Log the full OAuth URL so the redirect_uri parameter can be inspected in DevTools → Console
      console.log(`[CRM Debug] OAuth URL for ${crm}:`, url);
      const popup = window.open(url, '_blank');
      if (!popup) {
        // Popup blocked — navigate in current tab as fallback
        window.location.href = url;
        return;
      }
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setIsLoading(null);
          onConnectionChange();
        }
      }, 500);
    } catch (error) {
      setIsLoading(null);
      const label = crm === 'hubspot' ? 'HubSpot' : 'Salesforce';
      setErrorMsg(`Could not connect ${label}: ${error?.message || 'Unknown error'}`);
      console.error(`Failed to connect ${crm}:`, error);
    }
  };

  const handleDisconnect = async () => {
    const crm = disconnectTarget;
    setIsLoading(crm);
    try {
      const connectorId = crm === 'hubspot' ? HUBSPOT_CONNECTOR_ID : SALESFORCE_CONNECTOR_ID;
      await base44.connectors.disconnectAppUser(connectorId);
      setDisconnectTarget(null);
      onConnectionChange();
    } catch (error) {
      console.error(`Failed to disconnect ${crm}:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const neitherConnected = !hubspotConnected && !salesforceConnected;
  const bothConnected = hubspotConnected && salesforceConnected;

  let buttonLabel;
  if (neitherConnected) {
    buttonLabel = 'Connect CRM';
  } else if (bothConnected) {
    buttonLabel = 'HubSpot & Salesforce';
  } else if (hubspotConnected) {
    buttonLabel = 'HubSpot Connected';
  } else {
    buttonLabel = 'Salesforce Connected';
  }

  return (
    <>
      <AlertDialog open={!!disconnectTarget} onOpenChange={(open) => { if (!open) setDisconnectTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect from {disconnectTarget === 'hubspot' ? 'HubSpot' : 'Salesforce'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sync leads directly to your {disconnectTarget === 'hubspot' ? 'HubSpot' : 'Salesforce'} account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={!!isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={!!isLoading}
            className={
              neitherConnected
                ? 'bg-gray-700 hover:bg-gray-800 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : !neitherConnected ? (
              <Check className="w-4 h-4 mr-2" />
            ) : null}
            {buttonLabel}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* HubSpot row */}
          {hubspotConnected ? (
            <DropdownMenuItem
              onClick={() => setDisconnectTarget('hubspot')}
              className="text-red-600 focus:text-red-600"
            >
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Disconnect HubSpot
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleConnect('hubspot')}>
              <span className="w-4 h-4 mr-2 rounded-full inline-block shrink-0" style={{ background: '#BB3F27' }} />
              Connect HubSpot
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Salesforce row */}
          {salesforceConnected ? (
            <DropdownMenuItem
              onClick={() => setDisconnectTarget('salesforce')}
              className="text-red-600 focus:text-red-600"
            >
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Disconnect Salesforce
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleConnect('salesforce')}>
              <span className="w-4 h-4 mr-2 rounded-full inline-block shrink-0" style={{ background: '#00A1E0' }} />
              Connect Salesforce
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {errorMsg && (
        <p className="text-xs text-red-500 mt-1 max-w-[260px] text-right">{errorMsg}</p>
      )}
    </>
  );
}
