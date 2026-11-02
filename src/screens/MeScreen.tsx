import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Glass, PillButton, SnapImage } from '../components/ui';
import { F, THEMES, THEME_ORDER, useStyles, useTheme, type Theme, type ThemeKey } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { changePin, niceError, type Me, type Snap } from '../api';
import { remindersSupported } from '../notify';

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn} accessibilityLabel="Earlier">
        <Ionicons name="remove" size={18} color={C.ink} />
      </Pressable>
      <Text style={styles.stepVal}>{String(value).padStart(2, '0')}u</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn} accessibilityLabel="Later">
        <Ionicons name="add" size={18} color={C.ink} />
      </Pressable>
    </View>
  );
}

export function MeScreen({
  me,
  code,
  snaps,
  kept,
  reminders,
  start,
  end,
  onReminders,
  onWindow,
  onLogout,
  onTheme,
}: {
  me: Me;
  code: string;
  snaps: Snap[];
  kept: Snap[];
  reminders: boolean;
  start: number;
  end: number;
  onReminders: (on: boolean) => void;
  onWindow: (start: number, end: number) => void;
  onLogout: () => void;
  onTheme: (k: ThemeKey) => void;
}) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const mine = snaps.filter((s) => s.authorId === me.id);
  const reactionsGot = mine.reduce((n, s) => n + s.reactions.filter((r) => !r.startsWith(me.id + ':')).length, 0);
  const [pinOpen, setPinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const savePin = async () => {
    if (newPin.length < 4) return setPinMsg('The new PIN needs at least 4 digits.');
    setBusy(true);
    setPinMsg('');
    try {
      await changePin(code, oldPin, newPin);
      setPinMsg('PIN changed.');
      setOldPin('');
      setNewPin('');
    } catch (e) {
      setPinMsg(/invalid|password/i.test(String((e as Error).message)) ? 'Your current PIN is wrong.' : niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }]}>
      <View style={{ alignItems: 'center' }}>
        <Avatar id={me.id} name={me.name} size={96} ring />
        <Text style={styles.name}>{me.name}</Text>
        <Text style={styles.sub}>Family code {code.toUpperCase()}</Text>
      </View>

      <Glass style={styles.stats} strong>
        {[
          [mine.length, 'Snaps this week'],
          [kept.length, 'Kept forever'],
          [reactionsGot, 'Reactions'],
        ].map(([n, l], i) => (
          <View key={String(l)} style={[styles.stat, i > 0 && styles.statBorder]}>
            <Text style={styles.statNum}>{n}</Text>
            <Text style={styles.statLabel}>{l}</Text>
          </View>
        ))}
      </Glass>

      <Text style={styles.section}>
        <Ionicons name="star" size={16} color={C.accentDeep} /> Kept forever
      </Text>
      {kept.length === 0 ? (
        <Text style={styles.hint}>Tap the star on any snap to keep it after the 7 days.</Text>
      ) : (
        <View style={styles.grid}>
          {kept.map((s) => (
            <View key={s.$id} style={styles.tile}>
              <SnapImage fileId={s.backId} style={StyleSheet.absoluteFill as never} />
              <View style={styles.tileInset}>
                <SnapImage fileId={s.frontId} style={StyleSheet.absoluteFill as never} />
              </View>
              <Text style={styles.tileLabel}>
                {s.authorName} · {s.day.slice(8)}/{s.day.slice(5, 7)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.section}>Colours</Text>
      <View style={styles.themes}>
        {THEME_ORDER.map((k) => {
          const th = THEMES[k];
          const on = C.key === k;
          return (
            <Pressable key={k} onPress={() => onTheme(k)} style={styles.themeItem} accessibilityLabel={`${th.name} colours`}>
              <LinearGradient colors={th.bg} style={[styles.swatch, on && { borderColor: C.accent, borderWidth: 3 }]}>
                <View style={[styles.swatchDot, { backgroundColor: th.accent }]} />
              </LinearGradient>
              <Text style={[styles.themeName, on && { color: C.ink, fontFamily: F.semibold }]}>{th.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Settings</Text>
      <Glass style={styles.settings} strong>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Hourly reminders</Text>
            <Text style={styles.rowSub}>
              {remindersSupported ? 'A gentle nudge every hour. Skipping is fine.' : 'Reminders only work in the Android app.'}
            </Text>
          </View>
          <Switch
            value={reminders && remindersSupported}
            disabled={!remindersSupported}
            onValueChange={onReminders}
            trackColor={{ true: C.accent, false: C.empty }}
            thumbColor={C.white}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={[styles.rowTitle, { flex: 1 }]}>From</Text>
          <Stepper value={start} min={5} max={end} onChange={(v) => onWindow(v, end)} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowTitle, { flex: 1 }]}>Until</Text>
          <Stepper value={end} min={start} max={23} onChange={(v) => onWindow(start, v)} />
        </View>
        <View style={styles.divider} />
        <Pressable style={styles.row} onPress={() => setPinOpen((o) => !o)}>
          <Text style={[styles.rowTitle, { flex: 1 }]}>Change PIN</Text>
          <Ionicons name={pinOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
        </Pressable>
        {pinOpen && (
          <View style={{ gap: 8 }}>
            <TextInput style={styles.input} placeholder="Current PIN" placeholderTextColor={C.muted} secureTextEntry keyboardType="number-pad" value={oldPin} onChangeText={(t) => setOldPin(t.replace(/\D/g, ''))} maxLength={6} />
            <TextInput style={styles.input} placeholder="New PIN" placeholderTextColor={C.muted} secureTextEntry keyboardType="number-pad" value={newPin} onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))} maxLength={6} />
            {!!pinMsg && <Text style={styles.rowSub}>{pinMsg}</Text>}
            <PillButton title="Save PIN" dark busy={busy} onPress={savePin} />
          </View>
        )}
      </Glass>

      <PillButton title="Log out" icon="log-out-outline" onPress={onLogout} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
  wrap: { paddingHorizontal: 18, maxWidth: 560, width: '100%', alignSelf: 'center' },
  name: { fontFamily: F.semibold, fontSize: 26, color: C.headline, marginTop: 12, textShadowColor: C.headlineShadow, textShadowRadius: 10 },
  sub: { fontFamily: F.regular, fontSize: 13, color: C.inkSoft, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: 20, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderLeftColor: C.empty },
  statNum: { fontFamily: F.semibold, fontSize: 20, color: C.ink },
  statLabel: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  section: { fontFamily: F.semibold, fontSize: 18, color: C.ink, marginTop: 26, marginBottom: 12 },
  hint: { fontFamily: F.regular, fontSize: 14, color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', aspectRatio: 3 / 4, borderRadius: 22, overflow: 'hidden' },
  tileInset: { position: 'absolute', top: 8, left: 8, width: '32%', aspectRatio: 3 / 4, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: C.white },
  tileLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: C.white,
    fontFamily: F.semibold,
    fontSize: 12,
    backgroundColor: 'rgba(20,17,19,0.4)',
    borderRadius: 10,
    paddingVertical: 4,
    textAlign: 'center',
    overflow: 'hidden',
  },
  settings: { padding: 16, gap: 12 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeItem: { alignItems: 'center', gap: 6, width: 72 },
  swatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF' },
  themeName: { fontFamily: F.medium, fontSize: 12, color: C.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: F.medium, fontSize: 15, color: C.ink },
  rowSub: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.empty },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontFamily: F.semibold, fontSize: 15, color: C.ink, minWidth: 34, textAlign: 'center' },
  input: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    backgroundColor: C.field,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.ink,
  },
});
