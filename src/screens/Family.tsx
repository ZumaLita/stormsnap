import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Glass } from '../components/ui';
import { C, F } from '../theme';
import { dayKey, type Me, type Member, type Snap } from '../api';

export function Family({
  me,
  members,
  snaps,
  start,
  end,
  refreshing,
  onRefresh,
}: {
  me: Me;
  members: Member[];
  snaps: Snap[];
  start: number;
  end: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const insets = useSafeAreaInsets();
  const today = dayKey();
  const nowH = new Date().getHours();
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const byPerson = useMemo(() => {
    const m = new Map<string, { hours: Set<number>; extra: number }>();
    snaps
      .filter((s) => s.day === today)
      .forEach((s) => {
        const e = m.get(s.authorId) ?? { hours: new Set<number>(), extra: 0 };
        if (s.hour >= start && s.hour <= end) e.hours.add(s.hour);
        else e.extra++;
        m.set(s.authorId, e);
      });
    return m;
  }, [snaps, today, start, end]);

  const sorted = [...members].sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : a.name.localeCompare(b.name)));
  const totalSnaps = snaps.filter((s) => s.day === today).length;

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <Text style={styles.h1}>
        Family <Text style={styles.italic}>today</Text>
      </Text>
      <Text style={styles.sub}>
        {totalSnaps} snap{totalSnaps === 1 ? '' : 's'} so far · {String(start).padStart(2, '0')}u to {end}u
      </Text>

      <Glass style={styles.card} strong>
        <View style={styles.hourRow}>
          <View style={{ width: 92 }} />
          {hours.map((h) =>
            h % 3 === start % 3 ? (
              <Text key={h} style={[styles.hourLabel, h === nowH && { color: C.accentDeep }]}>
                {h}
              </Text>
            ) : (
              <View key={h} style={styles.hourLabelSpacer} />
            ),
          )}
        </View>
        {sorted.map((m) => {
          const e = byPerson.get(m.id);
          const count = e?.hours.size ?? 0;
          return (
            <View key={m.id} style={styles.personRow}>
              <View style={styles.person}>
                <Avatar id={m.id} name={m.name} size={32} />
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {m.id === me.id ? 'You' : m.name}
                  </Text>
                  <Text style={styles.count}>
                    {count}/{hours.length}
                    {e?.extra ? ` +${e.extra}` : ''}
                  </Text>
                </View>
              </View>
              {hours.map((h) => {
                const filled = e?.hours.has(h);
                return (
                  <View
                    key={h}
                    style={[
                      styles.cell,
                      { backgroundColor: filled ? C.accent : h > nowH ? 'rgba(28,20,24,0.05)' : C.empty },
                      h === nowH && !filled && styles.nowCell,
                    ]}
                  />
                );
              })}
            </View>
          );
        })}
      </Glass>

      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: C.accent }]} />
        <Text style={styles.legendText}>Snapped</Text>
        <View style={[styles.dot, { backgroundColor: C.empty }]} />
        <Text style={styles.legendText}>Skipped</Text>
        <Text style={styles.legendText}> · +1 = extra snap outside the hours</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, maxWidth: 560, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: F.semibold, fontSize: 36, color: C.white, textShadowColor: 'rgba(184,69,109,0.3)', textShadowRadius: 10 },
  italic: { fontFamily: F.lightItalic },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.inkSoft, marginTop: 4, marginBottom: 20 },
  card: { padding: 14, gap: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hourLabel: { flex: 1, fontFamily: F.medium, fontSize: 10, color: C.muted, textAlign: 'left' },
  hourLabelSpacer: { flex: 1 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  person: { width: 92, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  count: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  cell: { flex: 1, aspectRatio: 0.7, borderRadius: 4 },
  nowCell: { borderWidth: 1.5, borderColor: C.accent, backgroundColor: 'transparent' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: F.regular, fontSize: 12, color: C.inkSoft },
});
