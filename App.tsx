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
} from '@expo-google-fonts/figtree';
import { Background } from './src/components/ui';
import { PillNav, type Tab } from './src/components/PillNav';
import { Login } from './src/screens/Login';
import { Home } from './src/screens/Home';
import { Family } from './src/screens/Family';
import { MeScreen } from './src/screens/MeScreen';
import { Camera } from './src/screens/Camera';
import {
  cleanupOld,
  currentUser,
  deleteSnap,
  listKeptSnaps,
  listMembers,
  listRecentSnaps,
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
import { C } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Figtree_300Light_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_500Medium_Italic,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_700Bold_Italic,
  });
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
      const [m, s, k] = await Promise.all([listMembers(), listRecentSnaps(), listKeptSnaps(me.id)]);
      setMembers(m);
      setSnaps(s);
      setKept(k);
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

  if (!fontsLoaded || booting)
    return (
      <Background>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.white} size="large" />
        </View>
      </Background>
    );

  if (!me)
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Login
          onDone={(u, c) => {
            setCode(c);
            setItem('code', c);
            setMe(u);
          }}
        />
      </SafeAreaProvider>
    );

  const now = new Date();
  const onTime = now.getHours() >= start && now.getHours() <= end && now.getMinutes() < 15;

  if (camera)
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Camera
          me={me}
          onTime={onTime}
          onClose={() => setCamera(false)}
          onPosted={() => {
            setCamera(false);
            setTab('home');
            load();
          }}
        />
      </SafeAreaProvider>
    );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
        {tab === 'family' && (
          <Family me={me} members={members} snaps={snaps} start={start} end={end} refreshing={refreshing} onRefresh={load} />
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
          />
        )}
        <PillNav tab={tab} onTab={setTab} onSnap={() => setCamera(true)} />
      </Background>
    </SafeAreaProvider>
  );
}
