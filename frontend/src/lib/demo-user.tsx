// frontend/src/lib/demo-user.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '@/types';
import { fetchProfiles } from '@/lib/api';

interface DemoUserContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  availableUsers: Profile[];
  isOfficer: boolean;
}

const DEFAULT_USERS: Profile[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Thomas Kutty (തോമസ്)',
    phone: '+919447101001',
    role: 'farmer',
    village_or_padasekharam: 'Pulincunnoo Padasekharam',
    farm_type: 'paddy',
    latitude: 9.446,
    longitude: 76.458,
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Radhakrishnan M. (രാധാകൃഷ്ണൻ)',
    phone: '+919447101002',
    role: 'farmer',
    village_or_padasekharam: 'Moncompu Thekkekkara',
    farm_type: 'both',
    latitude: 9.429,
    longitude: 76.439,
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Sreedhar P. (കൃഷി ഓഫീസർ)',
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
});

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [availableUsers, setAvailableUsers] = useState<Profile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<Profile>(DEFAULT_USERS[0]);

  useEffect(() => {
    fetchProfiles()
      .then((users) => {
        if (users && users.length > 0) {
          setAvailableUsers(users);
        }
      })
      .catch(() => {});
  }, []);

  const isOfficer = currentUser.role === 'officer';

  return (
    <DemoUserContext.Provider value={{ currentUser, setCurrentUser, availableUsers, isOfficer }}>
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser() {
  return useContext(DemoUserContext);
}
