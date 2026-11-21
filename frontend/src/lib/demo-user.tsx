// frontend/src/lib/demo-user.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Language } from '@/types';
import { fetchProfiles, fetchAlerts } from '@/lib/api';
import { translations } from '@/lib/translations';

interface DemoUserContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  isOfficer: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.en) => string;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshAlertsCount: () => void;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Thomas Kutty',
    phone: '+919447101001',
    role: 'farmer',
    village_or_padasekharam: 'Pulincunnoo Padasekharam',
    farm_type: 'paddy',
    latitude: 9.446,
    longitude: 76.458,
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Radhakrishnan M.',
    phone: '+919447101002',
    role: 'farmer',
    village_or_padasekharam: 'Moncompu Thekkekkara',
    farm_type: 'both',
    latitude: 9.429,
    longitude: 76.439,
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Sreedhar P.',
    phone: '+919447101004',
    role: 'officer',
    village_or_padasekharam: 'Krishi Bhavan Champakulam',
    farm_type: 'paddy',
    latitude: 9.43,
    longitude: 76.432,
  },
];

const DemoUserContext = createContext<DemoUserContextType>({
  currentUser: DEFAULT_USERS[0],
  setCurrentUser: () => {},
  availableUsers: DEFAULT_USERS,
  isOfficer: false,
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => translations.en[key] || key,
  unreadCount: 3,
  setUnreadCount: () => {},
  refreshAlertsCount: () => {},
});

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [language, setLanguage] = useState<Language>('en');
  const [unreadCount, setUnreadCount] = useState<number>(3);

  const refreshAlertsCount = () => {
    fetchAlerts('all')
      .then((alerts) => {
        const unread = alerts.filter((a) => !a.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProfiles()
      .then((users) => {
        if (users && users.length > 0) {
          setAvailableUsers(users);
        }
      })
      .catch(() => {});

    refreshAlertsCount();
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ml' : 'en'));
  };

  const t = (key: keyof typeof translations.en): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || (key as string);
  };

  const isOfficer = currentUser.role === 'officer';

  return (
    <DemoUserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        isOfficer,
        language,
        setLanguage,
        toggleLanguage,
        t,
        unreadCount,
        setUnreadCount,
        refreshAlertsCount,
      }}
    >
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser() {
  return useContext(DemoUserContext);
}
