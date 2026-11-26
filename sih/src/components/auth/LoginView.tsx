import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../firebase/config';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();

  const [centerId, setCenterId] = useState<string>('OC-001');
  const [username, setUsername] = useState<string>(isFirebaseConfigured ? '' : 'rajkot_operator_1');
  const [password, setPassword] = useState<string>(isFirebaseConfigured ? '' : 'password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(centerId, username, password);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleQuickLogin = (demoCenterId: string, demoUser: string) => {
    setCenterId(demoCenterId);
    setUsername(demoUser);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Tricolor top border */}
      <div className="fixed top-0 left-0 right-0 h-2 flex">
        <div className="flex-1 bg-gov-saffron"></div>
        <div className="flex-1 bg-white border-y border-slate-200"></div>
        <div className="flex-1 bg-gov-green"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/emblem.svg"
            alt="National Emblem"
            className="w-16 h-16 drop-shadow-md"
          />
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-gov-navy tracking-tight">
          Online Procurement Assistance Center
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
          SIH26032 Smart Farmer Procurement Portal
        </p>
        <p className="text-center text-xs text-slate-500 mt-1">
          Authorized CSC / Village Service Assistant Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Authentication Failed:</span> {error}
                </div>
              </div>
            )}

            {/* Center ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Center ID
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value.toUpperCase())}
                  placeholder="e.g. OC-001"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy tracking-wide uppercase"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Unique identifier provided by the District Procurement Office.
              </p>
            </div>

            {/* Assistant username / email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isFirebaseConfigured ? 'Authorized Assistant Email' : 'Assistant Username / ID'}
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={isFirebaseConfigured ? 'email' : 'text'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isFirebaseConfigured ? 'e.g. assistant@center.gov.in' : 'e.g. rajkot_operator_1'}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gov-navy hover:bg-gov-navyDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gov-navy transition-all"
              >
                {isLoading ? (
                  <span>Authenticating Assistant...</span>
                ) : (
                  <>
                    <span>Sign In to Assisted Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          {!isFirebaseConfigured && <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Demo Fast-Login Credentials:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('OC-001', 'rajkot_operator_1')}
                className="text-left text-xs p-2.5 rounded-lg border border-slate-200 hover:border-gov-navy hover:bg-slate-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-800">OC-001</span>: Village Service Center - Rajkot
                  <div className="text-slate-500 text-[11px]">User: rajkot_operator_1</div>
                </div>
                <span className="text-[10px] font-bold text-gov-navy bg-blue-50 px-2 py-0.5 rounded">Use</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('OC-002', 'jasdan_operator_1')}
                className="text-left text-xs p-2.5 rounded-lg border border-slate-200 hover:border-gov-navy hover:bg-slate-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-800">OC-002</span>: CSC Center - Jasdan Taluka
                  <div className="text-slate-500 text-[11px]">User: jasdan_operator_1 (Rameshbhai)</div>
                </div>
                <span className="text-[10px] font-bold text-gov-navy bg-blue-50 px-2 py-0.5 rounded">Use</span>
              </button>
            </div>
          </div>}

          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-gov-green flex-shrink-0" />
            <span>
              This assistance dashboard is restricted to authorized Village Service Center assistants.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
