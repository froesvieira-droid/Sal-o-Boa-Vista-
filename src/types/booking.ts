export type DayStatus = 'free' | 'reserved' | 'blocked';

export type PaymentStatus = 'none' | 'pending' | 'deposit' | 'paid';

export type CalendarEntryStatus = 'reserved' | 'blocked';

export type ReservationType = 'reservation' | 'blocked';

export const OWNER_EMAIL = 'froesvieira@gmail.com';
export const VENUE_PROFILE_ID = 'boa-vista';
export const LOGO_PATH = '/assets/aistudio/file_000000009518820ea383abcc4510c946_d930134b.png';

/**
 * Verbatim validation constants synchronized with firebase-blueprint.json
 * and firestore.rules.
 */
export const BLUEPRINT_LIMITS = {
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  TIME_PATTERN: /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
  PUBLIC_NOTE_MAX: 160,
  TITLE_MIN: 1,
  TITLE_MAX: 120,
  DESCRIPTION_MAX: 1000,
  CLIENT_NAME_MAX: 120,
  CLIENT_PHONE_MAX: 40,
  GUEST_COUNT_MIN: 0,
  GUEST_COUNT_MAX: 500,
  TOTAL_VALUE_MAX: 40,
  UID_MAX: 128,
  VENUE_NAME_MAX: 100,
  VENUE_TAGLINE_MAX: 200,
  VENUE_DESCRIPTION_MAX: 2000,
  VENUE_AMENITIES_MAX: 1500,
  VENUE_RULES_MAX: 1500,
  VENUE_CAPACITY_MAX: 80,
  VENUE_HOURS_MAX: 80,
  VENUE_LOCATION_MAX: 200,
} as const;

export interface CalendarEntry {
  date: string;
  status: CalendarEntryStatus;
  publicNote: string;
  updatedAt?: unknown;
  updatedBy: string;
}

export interface ReservationRecord {
  date: string;
  type: ReservationType;
  title: string;
  description: string;
  clientName: string;
  clientPhone: string;
  guestCount: number;
  startTime: string;
  endTime: string;
  totalValue: string;
  paymentStatus: PaymentStatus;
  ownerUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VenueProfile {
  name: string;
  tagline: string;
  description: string;
  amenitiesDescription: string;
  rulesDescription: string;
  capacity: string;
  defaultHours: string;
  contactPhone: string;
  location: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export const DEFAULT_VENUE_PROFILE: VenueProfile = {
  name: 'Salão Boa Vista',
  tagline: 'Salão de festas completo com piscina, cascata e área de lazer',
  description:
    'O Salão Boa Vista oferece um ambiente amplo, aconchegante e preparado para receber aniversários, confraternizações, eventos familiares e celebrações especiais durante todo o ano.',
  amenitiesDescription:
    'Piscina ampla com cascata e área infantil, espaço gourmet coberto com churrasqueira, cozinha equipada com freezer e fogão, mesas, cadeiras e área verde ao ar livre.',
  rulesDescription:
    'As reservas são realizadas exclusivamente pelo proprietário mediante confirmação de data e sinal. Consulte os horários disponíveis e as orientações de uso do som e da área da piscina no ato do agendamento.',
  capacity: 'Até 100 convidados',
  defaultHours: '09:00 às 22:00',
  contactPhone: '',
  location: 'Boa Vista',
};

export interface ReservationFormInput {
  date: string;
  type: ReservationType;
  title: string;
  description: string;
  publicNote: string;
  clientName: string;
  clientPhone: string;
  guestCount: number;
  startTime: string;
  endTime: string;
  totalValue: string;
  paymentStatus: PaymentStatus;
}
