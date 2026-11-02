import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabBar, type Tab } from './src/components/TabBar';
import { Viewer } from './src/components/Viewer';
import { Login } from './src/screens/Login';
import { Home } from './src/screens/Home';
import { Streaks } from './src/screens/Streaks';
import { Memories } from './src/screens/Memories';
import { MeScreen } from './src/screens/MeScreen';
import { Camera } from './src/screens/Camera';
import {
  cleanupOld,
  currentUser,
  deleteSnap,
  listKeptSnaps,
  listMembers,
  listRecentSnaps,
  listStreakRows,
  logout,
  react,
  toggleKeep,
  type Me,
  type Member,
  type Snap,
} from './src/api';
import { DEFAULT_END_HOUR, DEFAULT_START_HOUR } from './src/config';
import { getItem, setItem } from './src/store';
import { onReminderTap, scheduleReminders } from './src/notify';
import { ACCENTS, ThemeContext, makeTheme, type AccentKey, type Appearance } from './src/theme';
import { computeStreak, type StreakRow } from './src/streak';

export default function App() {
  const systemDark = useColorScheme() === 'dark';
  const [appearance, setAppearance] = useState<Appearance>('auto');
  const [accentKey, setAccentKey] = useState<AccentKey>('blue');
  const theme = useMemo(() => makeTheme(appearance, accentKey, systemDark), [appearance, accentKey, systemDark]);

  const [booting, setBooting] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [camera, setCamera] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [kept, setKept] = useState<Snap[]>([]);
  const [streakRows, setStreakRows] = useState<StreakRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [start, setStart] = useState(DEFAULT_START_HOUR);
  const [end, setEnd] = useState(DEFAULT_END_HOUR);
  const [viewer, setViewer] = useState<{ ids: string[]; start: string } | null>(null);

  // Restore session and settings.
  useEffect(() => {
    (async () => {
      const [u, c, r, s, e, a, ac] = await Promise.all([
        currentUser(),
        getItem('code'),
        getItem('reminders'),
        getItem('start'),
        getItem('end'),
        getItem('appearance'),
        getItem('accent'),
      ]);
      if (r) setReminders(r === '1');
      if (s) setStart(Number(s));
      if (e) setEnd(Number(e));
      if (c) setCode(c);
      if (a === 'auto' || a === 'light' || a === 'dark') setAppearance(a);
      if (ac && ac in ACCENTS) setAccentKey(ac as AccentKey);
      setMe(u);
      setBooting(false);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!me) return;
    setRefreshing(true);
    try {
      const [m, s, k, sr] = await Promise.all([
        listMembers(),
        listRecentSnaps(),
        listKeptSnaps(me.id),
        listStreakRows().catch(() => null),
      ]);
      setMembers(m);
      setSnaps(s);
      setKept(k);
      if (sr) setStreakRows(sr);
    } catch (e) {
      console.warn('load failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [me]);

  useEffect(() => {
    if (!me) return;
    load();
    cleanupOld(me.id);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load());
    const off = onReminderTap(() => setCamera(true));
    return () => {
      sub.remove();
      off();
    };
  }, [me, load]);

  useEffect(() => {
    if (me) scheduleReminders(reminders, start, end).catch(() => {});
  }, [me, reminders, start, end]);

  const myStreak = useMemo(() => (me ? computeStreak(streakRows.filter((r) => r.authorId === me.id)).current : 0), [streakRows, me]);

  // Everything the viewer can show, kept fresh after reactions.
  const allById = useMemo(() => {
    const m = new Map<string, Snap>();
    [...kept, ...snaps].forEach((s) => m.set(s.$id, s));
    return m;
  }, [snaps, kept]);
  const viewerSnaps = viewer ? viewer.ids.map((id) => allById.get(id)).filter((s): s is Snap => !!s) : [];

  const replace = (s: Snap) => {
    setSnaps((all) => all.map((x) => (x.$id === s.$id ? s : x)));
    setKept((all) => {
      const without = all.filter((x) => x.$id !== s.$id);
      return me && s.keptBy.includes(me.id) ? [s, ...without] : without;
    });
  };

  const wrap = (node: React.ReactNode, lightContent = theme.dark) => (
    <ThemeContext.Provider value={theme}>
      <SafeAreaProvider>
        <StatusBar style={lightContent ? 'light' : 'dark'} />
        {node}
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );

  if (booting)
    return wrap(
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.secondary} />
      </View>,
    );

  if (!me)
    return wrap(
      <Login
        onDone={(u, c) => {
          setCode(c);
          setItem('code', c);
          setMe(u);
        }}
      />,
    );

  const now = new Date();
  const onTime = now.getHours() >= start && now.getHours() <= end && now.getMinutes() < 15;

  if (camera)
    return wrap(
      <Camera
        me={me}
        onTime={onTime}
        onClose={() => setCamera(false)}
        onPosted={() => {
          setCamera(false);
          setTab('home');
          load();
        }}
      />,
      true,
    );

  const open = (list: Snap[], id: string) => setViewer({ ids: list.map((s) => s.$id), start: id });

  return wrap(
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {tab === 'home' && (
        <Home
          me={me}
          members={members}
          snaps={snaps}
          streak={myStreak}
          refreshing={refreshing}
          onRefresh={load}
          onSnap={() => setCamera(true)}
          onOpen={open}
          onStreaks={() => setTab('streaks')}
        />
      )}
      {tab === 'streaks' && <Streaks me={me} members={members} rows={streakRows} refreshing={refreshing} onRefresh={load} />}
      {tab === 'memories' && <Memories me={me} kept={kept} snaps={snaps} refreshing={refreshing} onRefresh={load} onOpen={open} />}
      {tab === 'me' && (
        <MeScreen
          me={me}
          code={code}
          snaps={snaps}
          kept={kept}
          reminders={reminders}
          start={start}
          end={end}
          appearance={appearance}
          accentKey={accentKey}
          onAppearance={(a) => {
            setAppearance(a);
            setItem('appearance', a);
          }}
          onAccent={(k) => {
            setAccentKey(k);
            setItem('accent', k);
          }}
          onReminders={(on) => {
            setReminders(on);
            setItem('reminders', on ? '1' : '0');
          }}
          onWindow={(s, e) => {
            setStart(s);
            setEnd(e);
            setItem('start', String(s));
            setItem('end', String(e));
          }}
          onLogout={async () => {
            await scheduleReminders(false, start, end).catch(() => {});
            await logout();
            setMe(null);
            setSnaps([]);
            setKept([]);
            setStreakRows([]);
            setTab('home');
          }}
        />
      )}
      <TabBar tab={tab} onTab={setTab} onSnap={() => setCamera(true)} />
      <Viewer
        key={viewer?.start ?? 'none'}
        snaps={viewerSnaps}
        startId={viewer?.start ?? null}
        meId={me.id}
        onClose={() => setViewer(null)}
        onReact={async (s, e) => replace(await react(s, me.id, e))}
        onKeep={async (s) => replace(await toggleKeep(s, me.id))}
        onDelete={async (s) => {
          await deleteSnap(s);
          setSnaps((all) => all.filter((x) => x.$id !== s.$id));
          setKept((all) => all.filter((x) => x.$id !== s.$id));
          setViewer((v) => {
            if (!v) return v;
            const ids = v.ids.filter((id) => id !== s.$id);
            return ids.length ? { ids, start: ids[0] } : null;
          });
        }}
      />
    </View>,
  );
}
