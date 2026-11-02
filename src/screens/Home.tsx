import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, LargeTitle, PressScale, SnapTile, tapHaptic } from '../components/ui';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { R, T, useStyles, useTheme, type Theme } from '../theme';
import { dayKey, type Me, type Member, type Snap } from '../api';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function Home({
  me,
  members,
  snaps,
  streak,
  refreshing,
  onRefresh,
  onSnap,
  onOpen,
  onStreaks,
}: {
  me: Me;
  members: Member[];
  snaps: Snap[];
  streak: number;
  refreshing: boolean;
  onRefresh: () => void;
  onSnap: () => void;
  onOpen: (list: Snap[], id: string) => void;
  onStreaks: () => void;
}) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const today = dayKey();
  const [day, setDay] = useState(today);

  const days = useMemo(() => {
    const out: { key: string; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({ key: dayKey(d), date: d });
    }
    return out;
  }, []);
  const daysWithSnaps = useMemo(() => new Set(snaps.map((x) => x.day)), [snaps]);

  const people = useMemo(() => {
    const list = members.length ? members : [{ id: me.id, name: me.name }];
    const sorted = [...list].sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : a.name.localeCompare(b.name)));
    return sorted.map((m) => ({
      ...m,
      snaps: snaps.filter((x) => x.authorId === m.id && x.day === day).sort((a, b) => a.$createdAt.localeCompare(b.$createdAt)),
    }));
  }, [members, snaps, day, me]);

  const active = people.filter((p) => p.snaps.length);
  const quiet = people.filter((p) => !p.snaps.length);
  const meSnapped = people.find((p) => p.id === me.id)?.snaps.length ?? 0;
  const selected = (days.find((d) => d.key === day) ?? days[days.length - 1]).date;
  const title = day === today ? 'Today' : selected.toLocaleDateString(undefined, { weekday: 'long' });
  const subtitle = selected.toLocaleDateString(undefined, day === today ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
    >
      <LargeTitle
        title={title}
        subtitle={subtitle}
        right={
          <PressScale onPress={onStreaks} haptic accessibilityLabel={`Streak ${streak} hours`} style={s.streakChip}>
            <Ionicons name="flame" size={16} color={streak > 0 ? c.fire : c.tertiary} />
            <Text style={[T.headline, T.number, { color: c.label }]}>{streak}</Text>
          </PressScale>
        }
      />

      <View style={s.days}>
        {days.map((d) => {
          const on = d.key === day;
          const isToday = d.key === today;
          return (
            <Pressable
              key={d.key}
              onPress={() => {
                tapHaptic();
                setDay(d.key);
              }}
              accessibilityLabel={d.date.toDateString()}
              accessibilityState={{ selected: on }}
              style={s.dayItem}
            >
              <Text style={[T.caption2, { color: c.secondary }]}>{WEEKDAY[d.date.getDay()]}</Text>
              <View style={[s.dayNum, on && { backgroundColor: isToday ? c.accent : c.label }]}>
                <Text style={[T.headline, T.number, { color: on ? (isToday ? c.onAccent : c.bg) : isToday ? c.accent : c.label }]}>
                  {d.date.getDate()}
                </Text>
              </View>
              <View style={[s.dayDot, { backgroundColor: daysWithSnaps.has(d.key) ? c.secondary : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      {day === today && meSnapped === 0 && (
        <View style={s.prompt}>
          <View style={[s.promptIcon, { backgroundColor: c.accentTint }]}>
            <Ionicons name="camera" size={26} color={c.accent} />
          </View>
          <Text style={[T.headline, { color: c.label, marginTop: 12 }]}>What are you up to?</Text>
          <Text style={[T.subhead, { color: c.secondary, textAlign: 'center', marginTop: 4 }]}>
            Back camera, then a quick selfie. Skipping is always fine.
          </Text>
          <Button title="Take a snap" icon="camera" onPress={onSnap} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        </View>
      )}

      {active.map((p) => {
        const lastCaption = p.snaps.filter((x) => x.caption).slice(-1)[0]?.caption;
        return (
          <View key={p.id} style={s.person}>
            <View style={s.personHead}>
              <Avatar id={p.id} name={p.name} size={32} />
              <Text style={[T.headline, { color: c.label, flex: 1 }]}>{p.id === me.id ? 'You' : p.name}</Text>
              <Text style={[T.footnote, { color: c.secondary }]}>
                {p.snaps.length} snap{p.snaps.length === 1 ? '' : 's'} · {hhmm(p.snaps[p.snaps.length - 1].$createdAt)}
              </Text>
            </View>
            <FlatList
              horizontal
              data={p.snaps}
              keyExtractor={(x) => x.$id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              style={{ marginHorizontal: -16 }}
              renderItem={({ item }) => (
                <SnapTile
                  back={item.backId}
                  front={item.frontId}
                  width={136}
                  label={hhmm(item.$createdAt)}
                  badge={
                    item.reactions.length ? (
                      <View style={s.reactBadge}>
                        <Text style={[T.caption2, { color: '#FFFFFF' }]}>
                          {item.reactions[item.reactions.length - 1].split(':')[1]} {item.reactions.length}
                        </Text>
                      </View>
                    ) : undefined
                  }
                  onPress={() => onOpen(p.snaps, item.$id)}
                />
              )}
            />
            {!!lastCaption && (
              <Text style={[T.subhead, { color: c.secondary, marginTop: 8 }]} numberOfLines={2}>
                “{lastCaption}”
              </Text>
            )}
          </View>
        );
      })}

      {active.length === 0 && day !== today && (
        <Text style={[T.subhead, { color: c.secondary, textAlign: 'center', marginTop: 40 }]}>No snaps on this day.</Text>
      )}

      {quiet.length > 0 && (active.length > 0 || day === today) && (
        <View style={s.quiet}>
          {quiet.map((p) => (
            <View key={p.id} style={s.quietRow}>
              <Avatar id={p.id} name={p.name} size={24} />
              <Text style={[T.subhead, { color: c.secondary }]}>
                {p.id === me.id ? 'You' : p.name} {day === today ? "haven't snapped yet" : 'took a break'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
    streakChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 34,
      paddingHorizontal: 12,
      borderRadius: 17,
      backgroundColor: c.card,
      marginBottom: 6,
    },
    days: { flexDirection: 'row', marginTop: 14, marginBottom: 6 },
    dayItem: { flex: 1, alignItems: 'center', gap: 4 },
    dayNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    dayDot: { width: 5, height: 5, borderRadius: 3 },
    prompt: { backgroundColor: c.card, borderRadius: R.sheet, padding: 20, alignItems: 'center', marginTop: 18 },
    promptIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    person: { marginTop: 26 },
    personHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    reactBadge: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
    quiet: { marginTop: 28, gap: 10 },
    quietRow: { flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.8 },
  });
