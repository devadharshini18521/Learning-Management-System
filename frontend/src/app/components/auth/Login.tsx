import { useState, FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../ui/utils';
import { GraduationCap, Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface LoginProps {
  onForgotPassword: () => void;
}

// Auth functions type
interface AuthFunctions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
}

export default function Login({ onForgotPassword }: LoginProps) {
  const { login, register } = useAuth() as unknown as AuthFunctions;
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    let feedback = '';

    if (pwd.length >= 8) {
      strength += 25;
    } else {
      feedback = 'At least 8 characters';
    }

    if (/[a-z]/.test(pwd)) strength += 20;
    else if (!feedback) feedback = 'Add lowercase letters';

    if (/[A-Z]/.test(pwd)) strength += 20;
    else if (!feedback) feedback = 'Add uppercase letters';

    if (/[0-9]/.test(pwd)) strength += 20;
    else if (!feedback) feedback = 'Add numbers';

    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
    else if (!feedback) feedback = 'Add special characters';

    setPasswordStrength(strength);
    setPasswordFeedback(feedback || (strength >= 75 ? 'Strong password!' : ''));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    if (isRegistering) {
      calculatePasswordStrength(pwd);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ name, email, password });
        toast.success('Account created successfully!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(isRegistering ? 'Registration failed' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Zoho Learning</h1>
            <p className="text-indigo-200">
              {isRegistering ? 'Create your account' : 'Sign in to continue your journey'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Login/Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <Label htmlFor="name" className="text-white mb-2 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus:bg-white/15"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white mb-2 block">Email</Label>
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

            <div>
              <Label htmlFor="password" className="text-white mb-2 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-11 pr-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300 focus:bg-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator (Registration only) */}
              {isRegistering && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300">Strength:</span>
                    <span className={cn(
                      passwordStrength <= 25 ? 'text-red-400' :
                      passwordStrength <= 50 ? 'text-orange-400' :
                      passwordStrength <= 75 ? 'text-yellow-400' : 'text-green-400'
                    )}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-300", getStrengthColor())}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {!isRegistering && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-indigo-200 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 text-lg"
            >
              {loading ? (
                isRegistering ? 'Creating account...' : 'Signing in...'
              ) : (
                isRegistering ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-indigo-300 hover:text-indigo-200 text-sm transition-colors"
            >
              {isRegistering ? (
                <>Already have an account? <span className="font-semibold">Sign in</span></>
              ) : (
                <>Don&apos;t have an account? <span className="font-semibold">Register</span></>
              )}
            </button>
          </div>

          {/* Registration Benefits */}
          {isRegistering && (
            <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <p className="text-sm text-green-200 font-medium mb-2">Benefits of registering:</p>
              <ul className="text-xs text-green-300 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Access to all courses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Track your learning progress
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Earn certificates
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-indigo-300 text-sm mt-6">
          © 2026 Zoho Learning. All rights reserved.
        </p>
      </div>
    </div>
  );
}

