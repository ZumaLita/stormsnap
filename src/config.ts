// StormSnap settings (Appwrite project "StormSnap", Frankfurt).
export const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const PROJECT_ID = '6ae7959f0003367ddaf8';
export const PLATFORM_ID = 'be.ictstorm.stormsnap';

export const DB_ID = 'stormsnap';
export const SNAPS_TABLE = 'snaps';
export const BUCKET_ID = 'photos';
export const TEAM_ID = 'family';

// How long snaps live unless someone stars them.
export const KEEP_DAYS = 7;

// Default reminder window (24h clock, inclusive).
export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 21;

export const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏'];

/** Turns a name or code into a safe slug: "Mama Gees" -> "mama-gees". */
export const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Hidden login: the person only ever types family code, name and PIN. */
export const loginEmail = (name: string, code: string) =>
  `${slug(name)}@${slug(code)}.stormsnap.app`;
export const loginPassword = (code: string, pin: string) =>
  `stormsnap-${slug(code)}-${pin.trim()}`;
