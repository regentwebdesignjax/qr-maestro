import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode, Shield, User, CreditCard, LogOut, LayoutDashboard, BarChart3 } from 'lucide-react';
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
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Failed to open billing portal');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 hover:text-blue-700">
              <QrCode className="w-6 h-6" />
              QR Generator
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/Dashboard" className="text-gray-700 hover:text-blue-600 transition flex items-center gap-1">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link to="/CreateQR" className="text-gray-700 hover:text-blue-600 transition flex items-center gap-1">
                    <QrCode className="w-4 h-4" />
                    Create QR
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/AdminDashboard" className="text-purple-600 hover:text-purple-700 transition flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/" className="text-gray-700 hover:text-blue-600 transition">
                    Home
                  </Link>
                  <Link to="/WhyUs" className="text-gray-700 hover:text-blue-600 transition">
                    Why Us?
                  </Link>
                  <Link to="/FAQ" className="text-gray-700 hover:text-blue-600 transition">
                    FAQ
                  </Link>
                  <Link to="/Pricing" className="text-gray-700 hover:text-blue-600 transition">
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
                  <Button variant="ghost" onClick={handleLogin}>
                    Login
                  </Button>
                  <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
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
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 QR Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}