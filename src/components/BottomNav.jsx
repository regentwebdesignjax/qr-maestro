import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, QrCode, Plus, Users } from 'lucide-react';

export default function BottomNav({ user }) {
  const location = useLocation();
  const isPro = user?.role === 'admin' || (['black_belt', 'grand_master'].includes(user?.subscription_tier) && user?.subscription_status === 'active');

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '?');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden">
      <div className="flex items-end justify-around px-2 pb-safe">
        <Link
          to="/Dashboard"
          className={`flex flex-col items-center gap-1 py-3 px-4 min-h-[56px] justify-center transition-colors ${isActive('/Dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dojo</span>
        </Link>

        <Link
          to="/MyQRCodes"
          className={`flex flex-col items-center gap-1 py-3 px-4 min-h-[56px] justify-center transition-colors ${isActive('/MyQRCodes') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-medium">My QRs</span>
        </Link>

        {/* Center Create Button */}
        <Link
          to="/CreateQR"
          className={`flex flex-col items-center gap-1 py-3 px-4 min-h-[56px] justify-center transition-colors ${isActive('/CreateQR') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">Create</span>
        </Link>

        <Link
          to="/Leads"
          className={`flex flex-col items-center gap-1 py-3 px-4 min-h-[56px] justify-center transition-colors ${
            (!isPro) ? 'opacity-40 pointer-events-none' : isActive('/Leads') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Leads</span>
        </Link>
      </div>
    </nav>
  );
}