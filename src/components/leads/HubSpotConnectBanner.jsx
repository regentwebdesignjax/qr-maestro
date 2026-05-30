import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Check, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';

export default function HubSpotConnectButton({ connected, onConnectionChange }) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const url = await base44.connectors.connectAppUser(HUBSPOT_CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setIsLoading(false);
          onConnectionChange();
        }
      }, 500);
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to connect HubSpot:', error);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await base44.connectors.disconnectAppUser(HUBSPOT_CONNECTOR_ID);
      setShowDisconnectModal(false);
      onConnectionChange();
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to disconnect HubSpot:', error);
    }
  };

  return (
    <>
      <AlertDialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect from HubSpot?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sync leads directly to your HubSpot CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        onClick={connected ? () => setShowDisconnectModal(true) : handleConnect}
        disabled={isLoading}
        className={
          connected
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-[#BB3F27] hover:bg-[#A03520] text-white'
        }
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          </>
        ) : connected ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Connected to HubSpot
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Connect to HubSpot
          </>
        )}
      </Button>
    </>
  );
}