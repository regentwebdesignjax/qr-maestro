import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");
  const handleApple = () => base44.auth.loginWithProvider("apple", "/");

  return (
    <div className="min-h-screen flex font-poppins">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col items-center justify-center"
        style={{ background: "linear-gradient(135deg, #BB3F27 0%, #142024 100%)" }}
      >
        <div className="flex flex-col items-center text-center px-10">
          <img
            src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/9240fa714_sensei-qr-login-v2.png"
            alt="QR Sensei"
            className="w-48 h-auto mb-6"
          />
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-3xl tracking-tight">QR</span>
            <span className="text-white font-black text-3xl tracking-tight">SENSEI</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F0EB] px-6 py-12 min-h-screen">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-[#BB3F27] leading-tight mb-2">Welcome<br />back</h1>
            <p className="text-foreground/70 text-base">Log in to your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/40">
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium rounded-xl border-border"
                onClick={handleGoogle}
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium rounded-xl border-border"
                onClick={handleApple}
              >
                <AppleIcon className="w-5 h-5 mr-2" />
                Continue with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground tracking-widest">or</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-border focus-visible:ring-[#BB3F27]/30"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-[#BB3F27] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-border focus-visible:ring-[#BB3F27]/30"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base rounded-xl mt-2"
                style={{ backgroundColor: "#BB3F27" }}
                disabled={loading}
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in...</> : "Log in"}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#BB3F27] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}