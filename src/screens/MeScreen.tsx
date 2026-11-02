import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, ButtonGroup, Card, Icon, IconButton, ListItem, SectionLabel, Switch, TopBar, haptic } from '../components/ui';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { ACCENTS, ACCENT_ORDER, S, T, useStyles, useTheme, type AccentKey, type Appearance, type Theme } from '../theme';
import { changePin, niceError, type Me, type Snap } from '../api';
import { remindersSupported } from '../notify';

function HourStepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconButton icon="minus" label="Earlier" onPress={() => value > min && onChange(value - 1)} size={40} />
      <Text style={[T.titleMedium, T.num, { color: c.onSurface, minWidth: 52, textAlign: 'center' }]}>{String(value).padStart(2, '0')}:00</Text>
      <IconButton icon="plus" label="Later" onPress={() => value < max && onChange(value + 1)} size={40} />
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.surface }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 104 }]}
      keyboardShouldPersistTaps="handled"
    >
      <TopBar title="Me" />

      <Card style={[s.profile, { backgroundColor: c.secondaryContainer }]}>
        <Avatar id={me.id} name={me.name} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={[T.headlineSmall, { color: c.onSecondaryContainer }]}>{me.name}</Text>
          <Text style={[T.bodyMedium, { color: c.onSecondaryContainer, opacity: 0.8 }]}>Family {code.toUpperCase()}</Text>
        </View>
      </Card>

      <View style={s.stats}>
        {[
          [mine.length, 'This week', 'camera-outline'],
          [kept.length, 'Kept', 'star-outline'],
          [reactionsGot, 'Reactions', 'emoticon-outline'],
        ].map(([n, l, icon]) => (
          <Card key={String(l)} tone="base" style={s.stat}>
            <Icon name={icon as never} size={20} color={c.primary} />
            <Text style={[T.headlineSmall, T.num, { color: c.onSurface, marginTop: 6 }]}>{n}</Text>
            <Text style={[T.labelMedium, { color: c.onSurfaceVariant }]}>{l}</Text>
          </Card>
        ))}
      </View>

      <SectionLabel>Look</SectionLabel>
      <Card tone="low" style={{ padding: 16 }}>
        <ButtonGroup<Appearance>
          items={[
            { key: 'auto', label: 'System' },
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ]}
          value={appearance}
          onChange={onAppearance}
        />
        <Text style={[T.labelLarge, { color: c.onSurfaceVariant, marginTop: 20, marginBottom: 12 }]}>Colour</Text>
        <View style={s.swatches}>
          {ACCENT_ORDER.map((k) => {
            const on = k === accentKey;
            const col = ACCENTS[k][c.dark ? 'dark' : 'light'];
            return (
              <Pressable
                key={k}
                onPress={() => {
                  haptic();
                  onAccent(k);
                }}
                accessibilityLabel={`${ACCENTS[k].name} colour`}
                accessibilityState={{ selected: on }}
                style={[s.swatch, { backgroundColor: col, borderRadius: on ? S.lg : 28, borderWidth: 3, borderColor: on ? c.onSurface : 'transparent' }]}
              >
                {on && <Icon name="check" size={22} color={c.dark ? '#0E1322' : '#FFFFFF'} />}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionLabel>Reminders</SectionLabel>
      <Card tone="low">
        <ListItem
          icon="bell-outline"
          title="Hourly reminders"
          supporting={remindersSupported ? 'A nudge at the start of every hour' : 'Only in the Android app'}
          trailing={<Switch value={reminders && remindersSupported} disabled={!remindersSupported} onChange={onReminders} label="Hourly reminders" />}
        />
        <ListItem icon="weather-sunset-up" title="From" trailing={<HourStepper value={start} min={5} max={end} onChange={(v) => onWindow(v, end)} />} />
        <ListItem icon="weather-night" title="Until" trailing={<HourStepper value={end} min={start} max={23} onChange={(v) => onWindow(start, v)} />} />
      </Card>

      <SectionLabel>Account</SectionLabel>
      <Card tone="low">
        <ListItem icon="key-outline" title="Change PIN" supporting="6 digits is safer" onPress={() => setPinOpen((o) => !o)} trailing={<Icon name={pinOpen ? 'chevron-up' : 'chevron-down'} size={24} color={c.onSurfaceVariant} />} />
        {pinOpen && (
          <View style={{ padding: 16, paddingTop: 4, gap: 12 }}>
            <TextInput style={s.input} placeholder="Current PIN" placeholderTextColor={c.onSurfaceVariant} secureTextEntry keyboardType="number-pad" value={oldPin} onChangeText={(t) => setOldPin(t.replace(/\D/g, ''))} maxLength={8} />
            <TextInput style={s.input} placeholder="New PIN" placeholderTextColor={c.onSurfaceVariant} secureTextEntry keyboardType="number-pad" value={newPin} onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))} maxLength={8} />
            {!!pinMsg && <Text style={[T.bodySmall, { color: c.onSurfaceVariant }]}>{pinMsg}</Text>}
            <Button title="Save PIN" busy={busy} onPress={savePin} style={{ alignSelf: 'flex-start' }} />
          </View>
        )}
        <ListItem
          icon="logout"
          title="Log out"
          danger
          onPress={() => {
            if (Platform.OS === 'web' ? window.confirm('Log out of StormSnap?') : true) onLogout();
          }}
        />
      </Card>

      <Text style={[T.bodySmall, { color: c.onSurfaceVariant, textAlign: 'center', marginTop: 24 }]}>StormSnap · by Storm Gees</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
    profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, marginTop: 8 },
    stats: { flexDirection: 'row', gap: 8, marginTop: 8 },
    stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: S.lgInc },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: { width: 52, height: 52, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    swatchTop: { height: 28 },
    swatchBottom: { flexDirection: 'row', height: 28 },
    swatchCheck: { position: 'absolute', top: 14, left: 14, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    input: { height: 56, borderRadius: S.xs, borderWidth: 1, borderColor: c.outline, paddingHorizontal: 16, color: c.onSurface, ...T.bodyLarge },
  });
