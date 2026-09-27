/**
 * V0 clubs. This spike only swings the driver.
 * TODO: iron / wedge / putter selection, lie modifiers, and a putter
 * path that skips the accuracy click.
 */
export enum ClubId {
  Driver = 'driver',
  /** TODO: lower power, higher loft. Not selectable yet. */
  Iron = 'iron',
  /** TODO: short pitch. Not selectable yet. */
  Wedge = 'wedge',
  /** TODO: roll only. Not selectable yet. */
  Putter = 'putter',
}

export interface ClubDef {
  id: ClubId;
  label: string;
  /** Multiplier on driver launch speed. */
  powerScale: number;
  /** Launch angle in radians. */
  loft: number;
}

export const CLUBS: Record<ClubId, ClubDef> = {
  [ClubId.Driver]: {
    id: ClubId.Driver,
    label: 'Driver',
    powerScale: 1,
    loft: 0.58,
  },
  [ClubId.Iron]: {
    id: ClubId.Iron,
    label: 'Iron',
    powerScale: 0.72,
    loft: 0.78,
  },
  [ClubId.Wedge]: {
    id: ClubId.Wedge,
    label: 'Wedge',
    powerScale: 0.45,
    loft: 0.98,
  },
  [ClubId.Putter]: {
    id: ClubId.Putter,
    label: 'Putter',
    powerScale: 0.22,
    loft: 0.02,
  },
};

/** Only club wired into the swing spike. */
export const ACTIVE_CLUB: ClubDef = CLUBS[ClubId.Driver];
