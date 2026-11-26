import React, { createContext, useContext, useState } from 'react';
import { PreferredLanguage } from '../types';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const DICTIONARY: Translations = {
  portalTitle: {
    en: 'Online Procurement Assistance Center',
    hi: 'ऑनलाइन खरीद सहायता केंद्र',
  },
  subTitle: {
    en: 'Government of India • Ministry of Agriculture & Farmers Welfare',
    hi: 'भारत सरकार • कृषि एवं किसान कल्याण मंत्रालय',
  },
  assistedPortalTag: {
    en: 'Assisted Digital Service Portal (CSC / Village Center)',
    hi: 'सहायता प्राप्त डिजिटल सेवा पोर्टल (सीएससी / ग्राम केंद्र)',
  },
  operator: {
    en: 'Operator',
    hi: 'ऑपरेटर',
  },
  centerId: {
    en: 'Center ID',
    hi: 'केंद्र क्रमांक',
  },
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
  },
  farmerSearch: {
    en: 'Farmer Verification',
    hi: 'किसान सत्यापन',
  },
  registerFarmer: {
    en: 'New Farmer Registration',
    hi: 'नया किसान पंजीकरण',
  },
  cropRegistration: {
    en: 'Crop Registration',
    hi: 'फसल पंजीकरण',
  },
  bookAppointment: {
    en: 'Book Procurement Appointment',
    hi: 'खरीद अपॉइंटमेंट बुक करें',
  },
  todaysQueue: {
    en: "Today's Queue",
    hi: 'आज की कतार',
  },
  farmerStatus: {
    en: 'Procurement Status Tracker',
    hi: 'खरीद स्थिति ट्रैकर',
  },
  demoMode: {
    en: 'Demo Mode',
    hi: 'डेमो मोड',
  },
  farmersAssisted: {
    en: 'Farmers Assisted',
    hi: 'सहायता प्राप्त किसान',
  },
  newRegistrations: {
    en: 'New Registrations',
    hi: 'नए पंजीकरण',
  },
  appointmentsBooked: {
    en: 'Appointments Booked',
    hi: 'बुक किए गए अपॉइंटमेंट',
  },
  pendingRequests: {
    en: 'Pending in Queue',
    hi: 'कतार में लंबित',
  },
  completedRequests: {
    en: 'Procurement Completed',
    hi: 'खरीद पूर्ण',
  },
  token: {
    en: 'Queue Token',
    hi: 'टोकन नंबर',
  },
  farmerName: {
    en: 'Farmer Name',
    hi: 'किसान का नाम',
  },
  officialFarmerId: {
    en: 'Official Farmer ID',
    hi: 'आधिकारिक किसान आईडी',
  },
  mobileNumber: {
    en: 'Mobile Number',
    hi: 'मोबाइल नंबर',
  },
  village: {
    en: 'Village',
    hi: 'गांव',
  },
  printToken: {
    en: 'Print Appointment Slip',
    hi: 'अपॉइंटमेंट रसीद प्रिंट करें',
  },
};

interface LanguageContextType {
  language: PreferredLanguage;
  setLanguage: (lang: PreferredLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<PreferredLanguage>('en');

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    if (language === 'hi' && item.hi) return item.hi;
    return item.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};

