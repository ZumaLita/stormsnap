import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Figtree_300Light_Italic,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_500Medium_Italic,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_700Bold_Italic,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { Background } from './src/components/ui';
import { PillNav, type Tab } from './src/components/PillNav';
import { Login } from './src/screens/Login';
import { Home } from './src/screens/Home';
import { Streaks } from './src/screens/Streaks';
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
import { DEFAULT_THEME, THEMES, ThemeContext, type ThemeKey } from './src/theme';
import type { StreakRow } from './src/streak';

export default function App() {
  const [fontsLoaded] = useFonts({
    Figtree_300Light_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_500Medium_Italic,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_700Bold_Italic,
    Figtree_800ExtraBold,
  });
  const [themeKey, setThemeKey] = useState<ThemeKey>(DEFAULT_THEME);
  const theme = THEMES[themeKey];
  const [streakRows, setStreakRows] = useState<StreakRow[]>([]);
  const [booting, setBooting] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [camera, setCamera] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [kept, setKept] = useState<Snap[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [start, setStart] = useState(DEFAULT_START_HOUR);
  const [end, setEnd] = useState(DEFAULT_END_HOUR);

  // Restore session and settings.
  useEffect(() => {
    (async () => {
      const th = (await getItem('theme')) as ThemeKey | null;
      if (th && THEMES[th]) setThemeKey(th);
      const [u, c, r, s, e] = await Promise.all([
        currentUser(),
        getItem('code'),
        getItem('reminders'),
        getItem('start'),
        getItem('end'),
      ]);
      if (r) setReminders(r === '1');
      if (s) setStart(Number(s));
      if (e) setEnd(Number(e));
      if (c) setCode(c);
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

  // Keep reminders in sync with settings.
  useEffect(() => {
    if (me) scheduleReminders(reminders, start, end).catch(() => {});
  }, [me, reminders, start, end]);

  const replace = (s: Snap) => {
    setSnaps((all) => all.map((x) => (x.$id === s.$id ? s : x)));
    setKept((all) => {
      const without = all.filter((x) => x.$id !== s.$id);
      return me && s.keptBy.includes(me.id) ? [s, ...without] : without;
    });
  };

  const wrap = (node: React.ReactNode, light = !theme.dark) => (
    <ThemeContext.Provider value={theme}>
      <SafeAreaProvider>
        <StatusBar style={light ? 'dark' : 'light'} />
        {node}
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );

  if (!fontsLoaded || booting)
    return wrap(
      <Background>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      </Background>,
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
      false,
    );

  return wrap(
      <Background>
        {tab === 'home' && (
          <Home
            me={me}
            members={members}
            snaps={snaps}
            refreshing={refreshing}
            remindersOn={reminders}
            windowHours={end - start + 1}
            onRefresh={load}
            onSnap={() => setCamera(true)}
            onReact={async (s, e) => replace(await react(s, me.id, e))}
            onKeep={async (s) => replace(await toggleKeep(s, me.id))}
            onDelete={async (s) => {
              await deleteSnap(s);
              setSnaps((all) => all.filter((x) => x.$id !== s.$id));
              setKept((all) => all.filter((x) => x.$id !== s.$id));
            }}
            onBell={() => setTab('me')}
          />
        )}
        {tab === 'streaks' && (
          <Streaks me={me} members={members} rows={streakRows} refreshing={refreshing} onRefresh={load} />
        )}
        {tab === 'me' && (
          <MeScreen
            me={me}
            code={code}
            snaps={snaps}
            kept={kept}
            reminders={reminders}
            start={start}
            end={end}
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
              setTab('home');
            }}
            onTheme={(k) => {
              setThemeKey(k);
              setItem('theme', k);
            }}
          />
        )}
        <PillNav tab={tab} onTab={setTab} onSnap={() => setCamera(true)} />
      </Background>,
  );
}
