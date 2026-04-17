import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode, Shield, User, CreditCard, LogOut, LayoutDashboard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin('/Dashboard');
  };

  const handleBilling = async () => {
    try {
      const response = await base44.functions.invoke('createPortalSession');
      console.log('Portal response:', response);
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        console.error('No URL in response:', response);
        alert('Unable to open billing portal. Please contact support.');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to open billing portal. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/af65437e0_qr-sensei-logo-v1.png"
                alt="QR Sensei"
                className="h-9 w-auto"
              />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/Dashboard" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link to="/MyQRCodes" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                    <QrCode className="w-4 h-4" />
                    My QR Codes
                  </Link>
                  <Link to="/CreateQR" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                    <QrCode className="w-4 h-4" />
                    Create QR
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/AdminDashboard" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1.5 text-sm">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/" className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm">
                    Home
                  </Link>
                  <Link to="/WhyUs" className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm">
                    Why Us?
                  </Link>
                  <Link to="/FAQ" className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm">
                    FAQ
                  </Link>
                  <Link to="/Pricing" className="text-foreground/70 hover:text-primary transition-colors font-medium text-sm">
                    Pricing
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Buttons / User Menu */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.full_name || user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBilling}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin} className="font-semibold">
                    Login
                  </Button>
                  <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center mb-2">
            <img
              src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/af65437e0_qr-sensei-logo-v1.png"
              alt="QR Sensei"
              className="h-7 w-auto opacity-70"
            />
          </div>
          <p>&copy; 2026 QR Sensei. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}