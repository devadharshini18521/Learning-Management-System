import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GraduationCap, Mail, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../../../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
      
      // In development mode, log the reset URL
      if (response.resetUrl) {
        console.log('Reset URL:', response.resetUrl);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-indigo-200">
              {sent ? 'Check your email' : 'Enter your email to reset your password'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <p className="text-white mb-2">Password reset link sent!</p>
                <p className="text-indigo-200 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              
              {/* Development: Show reset link for testing */}
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
                <p className="text-xs text-yellow-200 mb-2 font-medium">Development Mode - Click to test:</p>
                <a 
                  href={`http://localhost:5173/reset-password/test-token`}
                  className="text-xs text-yellow-300 underline break-all hover:text-yellow-200"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    alert('In development mode, check the console for the reset URL after submitting the form.');
                  }}
                >
                  Test Reset Password Page
                </a>
              </div>
              
              <Button
                onClick={onBack}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-white mb-2 block">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus:bg-white/15"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Button
                type="button"
                onClick={onBack}
                variant="ghost"
                className="w-full text-indigo-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
