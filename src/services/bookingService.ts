import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  BLUEPRINT_LIMITS,
  CalendarEntryStatus,
  ReservationFormInput,
  ReservationRecord,
  VENUE_PROFILE_ID,
  VenueProfile,
} from '../types/booking';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

function getActorId(): string {
  return (auth.currentUser?.uid || 'owner').slice(0, BLUEPRINT_LIMITS.UID_MAX);
}

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function assertValidDate(date: string): string {
  const clean = date.trim();
  if (!BLUEPRINT_LIMITS.DATE_PATTERN.test(clean)) {
    throw new Error('Data inválida. Use o formato AAAA-MM-DD.');
  }
  return clean;
}

function normalizeTime(value: string, fallback: string): string {
  const clean = value.trim();
  return BLUEPRINT_LIMITS.TIME_PATTERN.test(clean) ? clean : fallback;
}

function normalizeGuestCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  return Math.max(
    BLUEPRINT_LIMITS.GUEST_COUNT_MIN,
    Math.min(BLUEPRINT_LIMITS.GUEST_COUNT_MAX, rounded),
  );
}

export async function saveReservationOrBlock(
  input: ReservationFormInput,
  existingRecord?: ReservationRecord | null,
): Promise<void> {
  const actorId = getActorId();
  const date = assertValidDate(input.date);
  const title = clampString(input.title, BLUEPRINT_LIMITS.TITLE_MAX);
  if (title.length < BLUEPRINT_LIMITS.TITLE_MIN) {
    throw new Error('Informe um título ou motivo.');
  }

  const availabilityStatus: CalendarEntryStatus =
    input.type === 'reservation' ? 'reserved' : 'blocked';

  const reservationRef = doc(db, 'reservations', date);
  const availabilityRef = doc(db, 'availability', date);

  const availabilityPayload = {
    date,
    status: availabilityStatus,
    publicNote: clampString(input.publicNote || '', BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX),
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  };

  const reservationPayload = {
    date,
    type: input.type,
    title,
    description: clampString(input.description || '', BLUEPRINT_LIMITS.DESCRIPTION_MAX),
    clientName:
      input.type === 'reservation'
        ? clampString(input.clientName || '', BLUEPRINT_LIMITS.CLIENT_NAME_MAX)
        : '',
    clientPhone:
      input.type === 'reservation'
        ? clampString(input.clientPhone || '', BLUEPRINT_LIMITS.CLIENT_PHONE_MAX)
        : '',
    guestCount:
      input.type === 'reservation' ? normalizeGuestCount(input.guestCount) : 0,
    startTime: normalizeTime(input.startTime, '09:00'),
    endTime: normalizeTime(input.endTime, '22:00'),
    totalValue:
      input.type === 'reservation'
        ? clampString(input.totalValue || '', BLUEPRINT_LIMITS.TOTAL_VALUE_MAX)
        : '',
    paymentStatus: input.type === 'reservation' ? input.paymentStatus : 'none',
    ownerUid: existingRecord?.ownerUid || actorId,
    createdAt: existingRecord?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(reservationRef, reservationPayload);
  batch.set(availabilityRef, availabilityPayload);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reservations/${date}`);
  }
}

export async function blockMultipleDates(params: {
  dates: string[];
  title: string;
  description: string;
  publicNote: string;
  existingMap: Record<string, ReservationRecord>;
}): Promise<void> {
  const actorId = getActorId();
  const cleanTitle = clampString(params.title, BLUEPRINT_LIMITS.TITLE_MAX);
  if (!cleanTitle) {
    throw new Error('Informe o motivo do bloqueio.');
  }

  const uniqueDates = Array.from(new Set(params.dates.map(assertValidDate)));
  if (uniqueDates.length === 0) {
    throw new Error('Selecione ao menos uma data para bloquear.');
  }

  const cleanDescription = clampString(
    params.description || '',
    BLUEPRINT_LIMITS.DESCRIPTION_MAX,
  );
  const cleanPublicNote = clampString(
    params.publicNote || '',
    BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX,
  );

  const CHUNK_SIZE = 200;
  for (let i = 0; i < uniqueDates.length; i += CHUNK_SIZE) {
    const chunk = uniqueDates.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const date of chunk) {
      const existing = params.existingMap[date];
      const reservationRef = doc(db, 'reservations', date);
      const availabilityRef = doc(db, 'availability', date);

      batch.set(availabilityRef, {
        date,
        status: 'blocked' as CalendarEntryStatus,
        publicNote: cleanPublicNote,
        updatedAt: serverTimestamp(),
        updatedBy: actorId,
      });

      batch.set(reservationRef, {
        date,
        type: 'blocked',
        title: cleanTitle,
        description: cleanDescription,
        clientName: '',
        clientPhone: '',
        guestCount: 0,
        startTime: '00:00',
        endTime: '23:59',
        totalValue: '',
        paymentStatus: 'none',
        ownerUid: existing?.ownerUid || actorId,
        createdAt: existing?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reservations/batch-block');
    }
  }
}

export async function updateDayDescriptions(params: {
  date: string;
  title: string;
  description: string;
  publicNote: string;
  existingRecord: ReservationRecord;
}): Promise<void> {
  const actorId = getActorId();
  const date = assertValidDate(params.date);
  const cleanTitle = clampString(params.title, BLUEPRINT_LIMITS.TITLE_MAX);
  if (!cleanTitle) {
    throw new Error('O título não pode ficar vazio.');
  }

  const reservationRef = doc(db, 'reservations', date);
  const availabilityRef = doc(db, 'availability', date);

  const batch = writeBatch(db);
  batch.update(reservationRef, {
    title: cleanTitle,
    description: clampString(params.description || '', BLUEPRINT_LIMITS.DESCRIPTION_MAX),
    updatedAt: serverTimestamp(),
  });
  batch.update(availabilityRef, {
    publicNote: clampString(params.publicNote || '', BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX),
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${date}`);
  }
}

export async function freeDate(dateISO: string): Promise<void> {
  const date = assertValidDate(dateISO);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'reservations', date));
  batch.delete(doc(db, 'availability', date));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reservations/${date}`);
  }
}

export async function saveVenueProfile(profile: VenueProfile): Promise<void> {
  const actorId = getActorId();
  const name = clampString(profile.name, BLUEPRINT_LIMITS.VENUE_NAME_MAX);
  if (!name) {
    throw new Error('O nome do salão é obrigatório.');
  }

  const payload = {
    name,
    tagline: clampString(profile.tagline || '', BLUEPRINT_LIMITS.VENUE_TAGLINE_MAX),
    description: clampString(profile.description || '', BLUEPRINT_LIMITS.VENUE_DESCRIPTION_MAX),
    amenitiesDescription: clampString(
      profile.amenitiesDescription || '',
      BLUEPRINT_LIMITS.VENUE_AMENITIES_MAX,
    ),
    rulesDescription: clampString(
      profile.rulesDescription || '',
      BLUEPRINT_LIMITS.VENUE_RULES_MAX,
    ),
    capacity: clampString(profile.capacity || '', BLUEPRINT_LIMITS.VENUE_CAPACITY_MAX),
    defaultHours: clampString(profile.defaultHours || '', BLUEPRINT_LIMITS.VENUE_HOURS_MAX),
    contactPhone: clampString(profile.contactPhone || '', BLUEPRINT_LIMITS.CLIENT_PHONE_MAX),
    location: clampString(profile.location || '', BLUEPRINT_LIMITS.VENUE_LOCATION_MAX),
    updatedAt: serverTimestamp(),
    updatedBy: actorId,
  };

  try {
    await setDoc(doc(db, 'venue', VENUE_PROFILE_ID), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `venue/${VENUE_PROFILE_ID}`);
  }
}
