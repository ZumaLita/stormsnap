import { BUCKET_ID, DB_ID, KEEP_DAYS, SNAPS_TABLE, TEAM_ID, loginEmail, loginPassword } from './config';
import { ID, Permission, Query, Role, account, imageDataUri, storage, tables, teams, uploadImage } from './sdk';

export type Me = { id: string; name: string };
export type Member = { id: string; name: string };
export type Snap = {
  $id: string;
  $createdAt: string;
  authorId: string;
  authorName: string;
  backId: string;
  frontId: string;
  caption?: string | null;
  hour: number;
  day: string;
  onTime: boolean;
  keptBy: string[];
  reactions: string[];
};

const familyRead = Role.team(TEAM_ID);

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function niceError(e: unknown) {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid credentials|Invalid `email`|user_invalid_credentials/i.test(msg))
    return "That doesn't match. Check the family code, your name and your PIN.";
  if (/network|fetch/i.test(msg)) return "Couldn't reach the server. Check your internet.";
  return msg;
}

// ---------- account ----------
export async function currentUser(): Promise<Me | null> {
  try {
    const u = await account.get();
    return { id: u.$id, name: u.name || 'Me' };
  } catch {
    return null;
  }
}

export async function login(code: string, name: string, pin: string): Promise<Me> {
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch {}
  await account.createEmailPasswordSession({
    email: loginEmail(name, code),
    password: loginPassword(code, pin),
  });
  const me = await currentUser();
  if (!me) throw new Error('Login failed');
  return me;
}

export async function logout() {
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch {}
}

export async function changePin(code: string, oldPin: string, newPin: string) {
  await account.updatePassword({
    password: loginPassword(code, newPin),
    oldPassword: loginPassword(code, oldPin),
  });
}

// ---------- family ----------
export async function listMembers(): Promise<Member[]> {
  const r = await teams.listMemberships({ teamId: TEAM_ID });
  return r.memberships.map((m) => ({ id: m.userId, name: m.userName || 'Family' }));
}

// ---------- snaps ----------
export async function listRecentSnaps(): Promise<Snap[]> {
  const since = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  const r = await tables.listRows({
    databaseId: DB_ID,
    tableId: SNAPS_TABLE,
    queries: [Query.greaterThan('$createdAt', since), Query.orderDesc('$createdAt'), Query.limit(200)],
  });
  return (r.rows as unknown as Snap[]).filter((x) => x.backId !== EXPIRED);
}

export const EXPIRED = 'expired';

/** Light rows (no photos) for every snap ever, used for streaks. */
export async function listStreakRows() {
  const out: { authorId: string; day: string; hour: number }[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const queries = [Query.select(['$id', 'authorId', 'day', 'hour']), Query.orderAsc('$createdAt'), Query.limit(500)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const r = await tables.listRows({ databaseId: DB_ID, tableId: SNAPS_TABLE, queries });
    const rows = r.rows as unknown as { $id: string; authorId: string; day: string; hour: number }[];
    rows.forEach((x) => out.push({ authorId: x.authorId, day: x.day, hour: x.hour }));
    if (rows.length < 500) break;
    cursor = rows[rows.length - 1].$id;
  }
  return out;
}

export async function listKeptSnaps(userId: string): Promise<Snap[]> {
  const r = await tables.listRows({
    databaseId: DB_ID,
    tableId: SNAPS_TABLE,
    queries: [Query.contains('keptBy', [userId]), Query.orderDesc('$createdAt'), Query.limit(200)],
  });
  return r.rows as unknown as Snap[];
}

export async function postSnap(
  me: Me,
  backUri: string,
  frontUri: string,
  caption: string,
  onTime: boolean,
): Promise<Snap> {
  const perms = [Permission.read(familyRead), Permission.delete(Role.user(me.id))];
  const stamp = Date.now();
  const [backId, frontId] = await Promise.all([
    uploadImage(backUri, `back-${stamp}.jpg`, perms),
    uploadImage(frontUri, `front-${stamp}.jpg`, perms),
  ]);
  const now = new Date();
  const row = await tables.createRow({
    databaseId: DB_ID,
    tableId: SNAPS_TABLE,
    rowId: ID.unique(),
    data: {
      authorId: me.id,
      authorName: me.name,
      backId,
      frontId,
      caption: caption.trim() || null,
      hour: now.getHours(),
      day: dayKey(now),
      onTime,
      keptBy: [],
      reactions: [],
    },
    permissions: [
      Permission.read(familyRead),
      Permission.update(familyRead),
      Permission.delete(Role.user(me.id)),
    ],
  });
  return row as unknown as Snap;
}

async function patch(snap: Snap, data: Partial<Snap>) {
  const row = await tables.updateRow({ databaseId: DB_ID, tableId: SNAPS_TABLE, rowId: snap.$id, data });
  return row as unknown as Snap;
}

export function toggleKeep(snap: Snap, userId: string) {
  const kept = snap.keptBy.includes(userId);
  return patch(snap, { keptBy: kept ? snap.keptBy.filter((k) => k !== userId) : [...snap.keptBy, userId] });
}

/** One reaction per person; tapping the same emoji again removes it. */
export function react(snap: Snap, userId: string, emoji: string) {
  const mine = snap.reactions.find((r) => r.startsWith(userId + ':'));
  const others = snap.reactions.filter((r) => !r.startsWith(userId + ':'));
  const next = mine === `${userId}:${emoji}` ? others : [...others, `${userId}:${emoji}`];
  return patch(snap, { reactions: next });
}

export async function deleteSnap(snap: Snap) {
  await tables.deleteRow({ databaseId: DB_ID, tableId: SNAPS_TABLE, rowId: snap.$id });
  await Promise.allSettled([
    storage.deleteFile({ bucketId: BUCKET_ID, fileId: snap.backId }),
    storage.deleteFile({ bucketId: BUCKET_ID, fileId: snap.frontId }),
  ]);
}

/**
 * Deletes the photos of my own snaps older than 7 days that nobody starred.
 * The tiny row stays (marked expired) so streaks keep their history.
 */
export async function cleanupOld(userId: string) {
  const before = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  try {
    const r = await tables.listRows({
      databaseId: DB_ID,
      tableId: SNAPS_TABLE,
      queries: [
        Query.equal('authorId', userId),
        Query.lessThan('$createdAt', before),
        Query.notEqual('backId', EXPIRED),
        Query.limit(100),
      ],
    });
    for (const s of r.rows as unknown as Snap[]) {
      if (s.keptBy?.length) continue;
      await Promise.allSettled([
        storage.deleteFile({ bucketId: BUCKET_ID, fileId: s.backId }),
        storage.deleteFile({ bucketId: BUCKET_ID, fileId: s.frontId }),
      ]);
      await tables.updateRow({
        databaseId: DB_ID,
        tableId: SNAPS_TABLE,
        rowId: s.$id,
        data: { backId: EXPIRED, frontId: EXPIRED, caption: null },
      });
    }
  } catch {}
}

// ---------- photos (cached) ----------
const cache = new Map<string, Promise<string>>();
export function photo(fileId: string) {
  let p = cache.get(fileId);
  if (!p) {
    p = imageDataUri(fileId);
    p.catch(() => cache.delete(fileId));
    cache.set(fileId, p);
  }
  return p;
}
