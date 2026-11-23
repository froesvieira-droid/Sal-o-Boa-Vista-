import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import {
  CalendarEntry,
  DEFAULT_VENUE_PROFILE,
  ReservationRecord,
  VENUE_PROFILE_ID,
  VenueProfile,
} from '../types/booking';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  authError: string | null;
  availabilityMap: Record<string, CalendarEntry>;
  reservationsMap: Record<string, ReservationRecord>;
  venueProfile: VenueProfile;
  availabilityLoaded: boolean;
  reservationsLoaded: boolean;
  signInOwner: () => Promise<void>;
  signOutOwner: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, CalendarEntry>>({});
  const [reservationsMap, setReservationsMap] = useState<Record<string, ReservationRecord>>({});
  const [venueProfile, setVenueProfile] = useState<VenueProfile>(DEFAULT_VENUE_PROFILE);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [reservationsLoaded, setReservationsLoaded] = useState(false);

  // Direct editing enabled without requiring login
  const isAdmin = true;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Calendar availability listener
  useEffect(() => {
    if (!authReady) return;

    const availabilityQuery = query(
      collection(db, 'availability'),
      where('status', 'in', ['reserved', 'blocked']),
    );

    const unsubscribe = onSnapshot(
      availabilityQuery,
      (snapshot) => {
        const nextMap: Record<string, CalendarEntry> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CalendarEntry;
          nextMap[docSnap.id] = {
            date: data.date || docSnap.id,
            status: data.status,
            publicNote: data.publicNote || '',
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy || '',
          };
        });
        setAvailabilityMap(nextMap);
        setAvailabilityLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'availability');
      },
    );

    return () => unsubscribe();
  }, [authReady]);

  // Venue profile listener
  useEffect(() => {
    if (!authReady) return;

    const venueRef = doc(db, 'venue', VENUE_PROFILE_ID);
    const unsubscribe = onSnapshot(
      venueRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as VenueProfile;
          const normalizedName =
            data.name === 'Salão Boa Vista' ? 'Espaço Boa Vista' : data.name;
          setVenueProfile({
            ...DEFAULT_VENUE_PROFILE,
            ...data,
            name: normalizedName || DEFAULT_VENUE_PROFILE.name,
          });
        } else {
          setVenueProfile(DEFAULT_VENUE_PROFILE);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `venue/${VENUE_PROFILE_ID}`);
      },
    );

    return () => unsubscribe();
  }, [authReady]);

  // Reservations & block details listener (direct access without login required)
  useEffect(() => {
    if (!authReady) return;

    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('type', 'in', ['reservation', 'blocked']),
    );

    const unsubscribe = onSnapshot(
      reservationsQuery,
      (snapshot) => {
        const nextMap: Record<string, ReservationRecord> = {};
        snapshot.forEach((docSnap) => {
          nextMap[docSnap.id] = docSnap.data() as ReservationRecord;
        });
        setReservationsMap(nextMap);
        setReservationsLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reservations');
      },
    );

    return () => unsubscribe();
  }, [authReady]);

  async function signInOwner(): Promise<void> {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao entrar com Google.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Não foi possível concluir o login com Google. Tente novamente.');
      }
    }
  }

  async function signOutOwner(): Promise<void> {
    setAuthError(null);
    await signOut(auth);
  }

  function clearAuthError(): void {
    setAuthError(null);
  }

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        authError,
        availabilityMap,
        reservationsMap,
        venueProfile,
        availabilityLoaded,
        reservationsLoaded,
        signInOwner,
        signOutOwner,
        clearAuthError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase deve ser usado dentro de FirebaseProvider.');
  }
  return ctx;
}
