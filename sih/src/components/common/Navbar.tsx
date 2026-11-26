import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { store } from '../../firebase/unifiedStore';
import {
  Building2,
  User,
  LogOut,
  RotateCcw,
  Languages,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { session, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleResetData = async () => {
    if (window.confirm('Reset all demo data (farmers, centers, appointments) back to default hackathon dataset?')) {
      await store.resetDemoData();
      alert('Demo data has been reset successfully!');
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm no-print">
      {/* National Tricolor Top Stripe */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-gov-saffron"></div>
        <div className="flex-1 bg-white border-y border-slate-200"></div>
        <div className="flex-1 bg-gov-green"></div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3.5">
            <img
              src="/emblem.svg"
              alt="National Agriculture Portal Emblem"
              className="w-11 h-11 object-contain drop-shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gov-navy tracking-tight">
                  {t('portalTitle')}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> SIH26032 CSC Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('subTitle')} <span className="text-gov-navy font-semibold">Assistant Service Desk</span>
              </p>
            </div>
          </div>

          {/* Center Info, Language & Operator Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Authorized Center Badge */}
            {session && (
              <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-1.5 shadow-inner">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gov-navy" />
                  <div className="text-xs leading-tight">
                    <span className="font-bold text-slate-800">{session.centerId}</span>
                    <span className="text-slate-500 ml-1.5 font-medium">
                      ({session.centerName})
                    </span>
                  </div>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <User className="w-3.5 h-3.5 text-gov-green" />
                  <span className="font-semibold">{session.operatorName}</span>
                </div>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-300 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-white text-gov-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  language === 'hi'
                    ? 'bg-white text-gov-navy shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Reset fictional demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset Demo</span>
            </button>

            {/* Logout */}
            {session && (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
                title="Logout Assistant Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
