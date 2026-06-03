import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import AppleIcon from "@/components/AppleIcon";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
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
        {showOtp ? (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-[#BB3F27] leading-tight mb-2">Verify your<br />email</h1>
              <p className="text-foreground/70 text-base">We sent a code to <span className="font-semibold text-foreground">{email}</span></p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/40">
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full h-12 font-semibold text-base rounded-xl"
                style={{ backgroundColor: "#BB3F27" }}
                onClick={handleVerify}
                disabled={loading || otpCode.length < 6}
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify"}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Didn't receive the code?{" "}
              <button onClick={handleResend} className="text-[#BB3F27] font-semibold hover:underline">
                Resend
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-[#BB3F27] leading-tight mb-2">Create your<br />account</h1>
              <p className="text-foreground/70 text-base">Sign up to get started</p>
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
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border focus-visible:ring-[#BB3F27]/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create account"}
                </Button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#BB3F27] font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}