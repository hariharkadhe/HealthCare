import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hospital, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Hospital Brand Badge */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white shadow-xl shadow-sky-500/20 mb-4 ring-4 ring-white/10">
          <Hospital className="h-9 w-9" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Medicare Pro
        </h2>
        <p className="mt-1 text-sm text-sky-300 font-medium tracking-wide">
          HOSPITAL APPOINTMENT & RECEPTION SYSTEM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Staff Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. receptionist@medicarepro.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to Reception Desk
            </Button>
          </form>

          {/* Quick Demo Credentials Fill Pills */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Demo Staff Logins (1-Click Fill):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('receptionist@medicarepro.com', 'Reception@123')}
                className="p-2 text-left rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                <strong className="block text-sky-900 font-semibold">Receptionist</strong>
                <span className="text-[11px] text-sky-700">Walk-in bookings & queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('admin@medicarepro.com', 'Admin@123')}
                className="p-2 text-left rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <strong className="block text-purple-900 font-semibold">Administrator</strong>
                <span className="text-[11px] text-purple-700">Doctors, schedules & logs</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('doctor.sharma@medicarepro.com', 'Doctor@123')}
                className="p-2 text-left rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <strong className="block text-emerald-900 font-semibold">Dr. Ananya Sharma</strong>
                <span className="text-[11px] text-emerald-700">Cardiology clinic queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('doctor.patel@medicarepro.com', 'Doctor@123')}
                className="p-2 text-left rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
              >
                <strong className="block text-teal-900 font-semibold">Dr. Rajesh Patel</strong>
                <span className="text-[11px] text-teal-700">General Medicine clinic</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Protected Clinical Reception Software • End-to-End Audited
        </p>
      </div>
    </div>
  );
};
