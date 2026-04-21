import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { QrCode, Shield, User, CreditCard, LogOut, Users, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';

export default function Layout({ children, currentPageName }) {
  usePageMeta(currentPageName);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen flex flex-col pb-0 md:pb-0">
      {/* Header Navigation */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || currentPageName !== 'Home' ? 'bg-white border-b border-border shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
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
                  <Link to="/MyQRCodes" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                    <QrCode className="w-4 h-4" />
                    My QR Codes
                  </Link>
                  <Link to="/CreateQR" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                    <QrCode className="w-4 h-4" />
                    Create QR
                  </Link>
                  {(user?.subscription_tier === 'pro' || user?.role === 'admin') && (
                    <Link to="/Leads" className="text-foreground/70 hover:text-primary transition-colors font-medium flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4" />
                      Leads
                    </Link>
                  )}
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
                <>
                  {/* Desktop: Upgrade + Dropdown */}
                  <div className="hidden md:flex items-center gap-3">
                    {user.role !== 'admin' && user.subscription_tier !== 'pro' && (
                      <Link to="/Pricing">
                        <Button variant="outline" className="font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200">
                          Upgrade Rank
                        </Button>
                      </Link>
                    )}
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
                  </div>

                  {/* Mobile: Hamburger Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden h-10 w-10">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 p-0">
                      <SheetHeader className="p-6 border-b bg-muted/30">
                        <SheetTitle className="text-left">Menu</SheetTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{user.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </SheetHeader>
                      <div className="p-4 space-y-1">
                        {user.role !== 'admin' && user.subscription_tier !== 'pro' && (
                          <Link to="/Pricing">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors">
                              <CreditCard className="w-4 h-4" />
                              Upgrade to Black Belt
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={handleBilling}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                        >
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          Billing & Subscription
                        </button>
                        {user.role === 'admin' && (
                          <Link to="/AdminDashboard">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/5 transition-colors text-sm">
                              <Shield className="w-4 h-4" />
                              Admin Dashboard
                            </button>
                          </Link>
                        )}
                        <div className="pt-2 border-t mt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin} className="font-semibold transition-colors duration-200 text-foreground hover:text-primary">
                    Login
                  </Button>
                  <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors duration-200">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Nav — mobile only */}
      {user && <BottomNav user={user} />}

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center mb-2">
            <img
              src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/af65437e0_qr-sensei-logo-v1.png"
              alt="QR Sensei"
              className="h-7 w-auto opacity-70"
            />
          </div>
          <p>&copy; 2026 QR Sensei. All rights reserved.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Forged with discipline in Jacksonville, FL.</p>
          <div className="flex justify-center gap-6 mt-4 text-xs font-poppins">
            <Link to="/PrivacyPolicy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/TermsOfService" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}