'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AppContextType {
  region: string;
  month: string;
  setRegion: (region: string) => void;
  setMonth: (month: string) => void;
  updateUrl: (params: Record<string, string>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within Providers');
  }
  return context;
}

const REGIONS = ['india', 'apac', 'emea', 'americas', 'global'];

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [region, setRegionState] = useState('india');
  const [month, setMonthState] = useState('2025-09');

  useEffect(() => {
    // Initialize from URL params
    const urlRegion = searchParams.get('region');
    const urlMonth = searchParams.get('month');
    
    if (urlRegion && REGIONS.includes(urlRegion)) {
      setRegionState(urlRegion);
    }
    
    if (urlMonth && /^\d{4}-\d{2}$/.test(urlMonth)) {
      setMonthState(urlMonth);
    }
  }, [searchParams]);

  const updateUrl = (params: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      current.set(key, value);
    });
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    router.push(`${window.location.pathname}${query}`, { scroll: false });
  };

  const setRegion = (newRegion: string) => {
    setRegionState(newRegion);
    updateUrl({ region: newRegion, month });
  };

  const setMonth = (newMonth: string) => {
    setMonthState(newMonth);
    updateUrl({ region, month: newMonth });
  };

  const value: AppContextType = {
    region,
    month,
    setRegion,
    setMonth,
    updateUrl,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}