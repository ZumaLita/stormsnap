import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, LargeTitle, Row, Section, Segmented, tapHaptic } from '../components/ui';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { ACCENTS, ACCENT_ORDER, T, useStyles, useTheme, type AccentKey, type Appearance, type Theme } from '../theme';
import { changePin, niceError, type Me, type Snap } from '../api';
import { remindersSupported } from '../notify';

function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const c = useTheme();
  const btn = (icon: 'remove' | 'add', next: number, disabled: boolean) => (
    <Pressable
      onPress={() => {
        if (disabled) return;
        tapHaptic();
        onChange(next);
      }}
      accessibilityLabel={icon === 'add' ? 'Later' : 'Earlier'}
      style={{ width: 44, height: 32, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}
    >
      <Ionicons name={icon} size={18} color={c.label} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={[T.body, T.number, { color: c.secondary }]}>{String(value).padStart(2, '0')}:00</Text>
      <View style={{ flexDirection: 'row', backgroundColor: c.fill, borderRadius: 8 }}>
        {btn('remove', value - 1, value <= min)}
        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.separator, marginVertical: 6 }} />
        {btn('add', value + 1, value >= max)}
      </View>
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
  appearance,
  accentKey,
  onAppearance,
  onAccent,
  onReminders,
  onWindow,
  onLogout,
}: {
  me: Me;
  code: string;
  snaps: Snap[];
  kept: Snap[];
  reminders: boolean;
  start: number;
  end: number;
  appearance: Appearance;
  accentKey: AccentKey;
  onAppearance: (a: Appearance) => void;
  onAccent: (k: AccentKey) => void;
  onReminders: (on: boolean) => void;
  onWindow: (start: number, end: number) => void;
  onLogout: () => void;
}) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const mine = snaps.filter((x) => x.authorId === me.id);
  const reactionsGot = mine.reduce((n, x) => n + x.reactions.filter((r) => !r.startsWith(me.id + ':')).length, 0);
  const [pinOpen, setPinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const savePin = async () => {
    if (newPin.length < 4) return setPinMsg('Use at least 4 digits. 6 is safer.');
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

  const confirmLogout = () => {
    if (Platform.OS === 'web' ? window.confirm('Log out of StormSnap?') : true) onLogout();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <LargeTitle title="Me" />

      <View style={s.profile}>
        <Avatar id={me.id} name={me.name} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={[T.title2, { color: c.label }]}>{me.name}</Text>
          <Text style={[T.subhead, { color: c.secondary }]}>Family {code.toUpperCase()}</Text>
        </View>
      </View>

      <View style={s.stats}>
        {[
          [mine.length, 'Snaps this week'],
          [kept.length, 'Kept'],
          [reactionsGot, 'Reactions'],
        ].map(([n, l], i) => (
          <View key={String(l)} style={[s.stat, i > 0 && s.statLine]}>
            <Text style={[T.title2, T.number, { color: c.label }]}>{n}</Text>
            <Text style={[T.caption, { color: c.secondary }]}>{l}</Text>
          </View>
        ))}
      </View>

      <Section title="Appearance" padded>
        <Segmented<Appearance>
          items={[
            { key: 'auto', label: 'Automatic' },
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ]}
          value={appearance}
          onChange={onAppearance}
        />
        <Text style={[T.footnote, { color: c.secondary, marginTop: 16, marginBottom: 10 }]}>Accent colour</Text>
        <View style={s.accents}>
          {ACCENT_ORDER.map((k) => {
            const on = k === accentKey;
            const col = ACCENTS[k][c.dark ? 'dark' : 'light'];
            return (
              <Pressable
                key={k}
                onPress={() => {
                  tapHaptic();
                  onAccent(k);
                }}
                accessibilityLabel={`${ACCENTS[k].name} accent`}
                accessibilityState={{ selected: on }}
                style={[s.accentRing, { borderColor: on ? col : 'transparent' }]}
              >
                <View style={[s.accentDot, { backgroundColor: col }]}>{on && <Ionicons name="checkmark" size={16} color={k === 'graphite' && c.dark ? '#000' : '#FFF'} />}</View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section
        title="Reminders"
        footer={remindersSupported ? 'A gentle nudge at the start of every hour. Snapping is always optional.' : 'Hourly reminders work in the Android app.'}
      >
        <Row
          icon="notifications"
          iconBg="#FF3B30"
          title="Hourly reminders"
          right={
            <Switch
              value={reminders && remindersSupported}
              disabled={!remindersSupported}
              onValueChange={onReminders}
              trackColor={{ true: '#34C759', false: c.fill }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.fill}
            />
          }
        />
        <Row icon="sunny" iconBg="#FF9500" title="From" right={<Stepper value={start} min={5} max={end} onChange={(v) => onWindow(v, end)} />} />
        <Row icon="moon" iconBg="#5856D6" title="Until" right={<Stepper value={end} min={start} max={23} onChange={(v) => onWindow(start, v)} />} last />
      </Section>

      <Section title="Account">
        <Row icon="key" iconBg="#8E8E93" title="Change PIN" onPress={() => setPinOpen((o) => !o)} chevron last={!pinOpen} />
        {pinOpen && (
          <View style={s.pinBox}>
            <TextInput style={s.input} placeholder="Current PIN" placeholderTextColor={c.tertiary} secureTextEntry keyboardType="number-pad" value={oldPin} onChangeText={(t) => setOldPin(t.replace(/\D/g, ''))} maxLength={8} />
            <TextInput style={s.input} placeholder="New PIN (6 digits is safer)" placeholderTextColor={c.tertiary} secureTextEntry keyboardType="number-pad" value={newPin} onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))} maxLength={8} />
            {!!pinMsg && <Text style={[T.footnote, { color: c.secondary }]}>{pinMsg}</Text>}
            <Button title="Save PIN" busy={busy} onPress={savePin} />
          </View>
        )}
      </Section>

      <Section>
        <Row title="Log out" destructive onPress={confirmLogout} last />
      </Section>

      <Text style={[T.footnote, { color: c.tertiary, textAlign: 'center', marginTop: 24 }]}>StormSnap · by Storm Gees</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
    profile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderRadius: 12, padding: 16, marginTop: 16 },
    stats: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
    stat: { flex: 1, alignItems: 'center' },
    statLine: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.separator },
    accents: { flexDirection: 'row', justifyContent: 'space-between' },
    accentRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    accentDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    pinBox: { padding: 16, paddingTop: 4, gap: 10 },
    input: {
      height: 44,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: c.fill,
      color: c.label,
      ...T.body,
    },
  });
