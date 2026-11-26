import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Farmer } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { isFirebaseConfigured } from '../../firebase/config';
import {
  generateInternalAuthEmail,
  generateTemporaryPin,
  provisionFarmerAccount,
  removeProvisionedFarmerAccount,
} from '../../firebase/farmerAccounts';
import { generateFarmerId } from '../../utils/tokenGenerator';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface FarmerRegistrationViewProps {
  onRegistrationComplete?: (farmer: Farmer) => void;
  onNavigateToBooking?: (farmer: Farmer) => void;
}

function registrationErrorMessage(error: unknown): string {
  const firebaseError = error as { code?: string; message?: string } | undefined;

  if (firebaseError?.code === 'permission-denied' || /missing or insufficient permissions/i.test(firebaseError?.message || '')) {
    return 'Your operator account is not authorized to create farmer profiles. Ask an administrator to confirm that your /users/{uid} record has role "assistant" and deploy the Firestore rules in this project.';
  }

  return firebaseError?.message || 'Registration could not be completed. Please try again.';
}

export const FarmerRegistrationView: React.FC<FarmerRegistrationViewProps> = ({
  onRegistrationComplete,
  onNavigateToBooking,
}) => {
  const { session } = useAuth();

  // Form Fields
  const [name, setName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [district, setDistrict] = useState<string>('Rajkot');
  const [state, setState] = useState<string>('Gujarat');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredFarmer, setRegisteredFarmer] = useState<Farmer | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [temporaryPin, setTemporaryPin] = useState<string | null>(null);

  const officialFarmerId = generateFarmerId(name, mobileNumber) || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    const cleanName = name.trim();
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const cleanVillage = village.trim();
    const cleanId = generateFarmerId(cleanName, cleanMobile);

    // Validation
    if (!cleanName) {
      setErrorMessage('Farmer full name is required.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanId) {
      setErrorMessage('Enter the farmer name and a valid 10-digit mobile number to generate a Farmer ID.');
      return;
    }
    if (!cleanVillage) {
      setErrorMessage('Village name is required.');
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Prevent duplicate farmer profiles
      const dupCheck = await store.checkDuplicateFarmer(cleanId, cleanMobile);
      if (dupCheck.exists) {
        setErrorMessage(dupCheck.reason || 'Farmer profile already exists in centralized database.');
        setIsSubmitting(false);
        return;
      }

      const now = new Date().toISOString();
      const temporaryPin = isFirebaseConfigured ? generateTemporaryPin() : '';
      const authEmail = isFirebaseConfigured ? generateInternalAuthEmail() : undefined;
      let provisionedUser: Awaited<ReturnType<typeof provisionFarmerAccount>> | null = null;
      const newFarmer: Farmer = {
        id: cleanId,
        farmerId: cleanId,
        officialFarmerId: cleanId,
        name: cleanName,
        phone: cleanMobile,
        address: `${cleanVillage}, ${district}, ${state}`,
        mobileNumber: cleanMobile,
        village: cleanVillage,
        district,
        state,
        preferredLanguage: 'gu',
        registeredByCenterId: session?.centerId || 'OC-001',
        crops: [],
        createdAt: now,
        updatedAt: now,
      };

      try {
        if (isFirebaseConfigured && authEmail) {
          provisionedUser = await provisionFarmerAccount(authEmail, temporaryPin);
          newFarmer.id = provisionedUser.uid;
          newFarmer.farmerUid = provisionedUser.uid;
        }
        await store.createFarmer(newFarmer, authEmail);
      } catch (error) {
        if (provisionedUser) await removeProvisionedFarmerAccount(provisionedUser).catch(() => undefined);
        throw error;
      }

      setRegisteredFarmer(newFarmer);
      setTemporaryPin(temporaryPin || null);
      setSuccessBanner('Farmer verified and profile created successfully.');
      onRegistrationComplete?.(newFarmer);
    } catch (err: any) {
      setErrorMessage('Error registering farmer: ' + registrationErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoValues = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setName('Bharatbhai V. Vala');
    setMobileNumber(`9898${randomSuffix}`);
    setVillage('Navagadh Rural');
    setDistrict('Rajkot');
    setState('Gujarat');
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-gov-green border border-emerald-200">
              <UserPlus className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Assisted New Farmer Registration
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Create a permanent central farmer profile on behalf of non-smartphone farmers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillDemoValues}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Fill Sample Farmer
        </button>
      </div>

      {/* Success Notification Banner */}
      {successBanner && registeredFarmer && (
        <div className="p-5 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-base font-bold text-emerald-900">
                {successBanner}
              </div>
              <div className="text-xs text-emerald-700">
                Permanent Farmer ID: <span className="font-mono font-bold">{registeredFarmer.officialFarmerId}</span> | Name: <span className="font-bold">{registeredFarmer.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToBooking?.(registeredFarmer)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded-lg shadow-sm hover:bg-gov-navyDark transition-colors"
            >
              <span>Proceed to Book Procurement Appointment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSuccessBanner(null);
                setRegisteredFarmer(null);
                setTemporaryPin(null);
                handleFillDemoValues();
              }}
              className="px-3 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Register Another Farmer
            </button>
          </div>
          {temporaryPin && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              <div className="font-bold">Give this PIN to the farmer. It is used to log in to the Farmer App.</div>
              <div className="mt-1">Farmer ID: <span className="font-mono font-bold">{registeredFarmer.officialFarmerId}</span></div>
              <div>Mobile: <span className="font-mono font-bold">{registeredFarmer.mobileNumber}</span></div>
              <div>Temporary PIN: <span className="font-mono text-base font-bold tracking-widest">{temporaryPin}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold">Registration Alert</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Section 1: Farmer Identity */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-gov-navy" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Official Farmer Identity (Permanent Profile)
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Farmer ID (Generated Automatically)
                </label>
                <input
                  type="text"
                  value={officialFarmerId}
                  placeholder="Enter name and mobile number to generate"
                  readOnly
                  aria-readonly="true"
                  className="mt-1.5 block w-full px-3 py-2.5 border border-emerald-300 bg-emerald-50 rounded-lg text-sm font-mono font-bold text-emerald-900"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Format: FID-NAME-LAST4MOBILE, e.g. FID-BHARAT-3210.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Farmer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bharatbhai Vala"
                  required
                  className="mt-1.5 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mobile Number *
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    maxLength={10}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  SMS alerts & queue calls will be sent here.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Preferences */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-gov-navy" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Residential Location & Language
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Village *
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Navagadh Rural"
                  required
                  className="mt-1.5 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  District *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Rajkot"
                  required
                  className="mt-1.5 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  State *
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Gujarat"
                  required
                  className="mt-1.5 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-gov-navy focus:border-gov-navy"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            Registration creates a permanent identity under National Farmer Registry.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gov-green hover:bg-gov-greenDark text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying and Registering...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Create Farmer Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
