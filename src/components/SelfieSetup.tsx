import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Press, haptic } from './ui';
import { S, T, useTheme } from '../theme';
import { SELFIE_BUTTON_SECONDS, type SelfieMode } from '../screens/Camera';

const DELAYS = [1, 2, 3, 5, 10];

export const describeSelfie = (s: SelfieMode) =>
  s.mode === 'button' ? `You press the button, within ${SELFIE_BUTTON_SECONDS} seconds` : s.delay > 0 ? `Automatic after ${s.delay} second${s.delay === 1 ? '' : 's'}` : 'Automatic, right away';

/** Asks once how you want your selfie: automatic after some seconds, or yourself with the button. */
export function SelfieSetup({ open, value, onDone }: { open: boolean; value: SelfieMode; onDone: (s: SelfieMode) => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<'choose' | 'seconds'>('choose');
  const [delay, setDelay] = useState(value.mode === 'auto' && value.delay > 0 ? value.delay : 3);

  const Choice = ({ icon, title, text, onPress }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; text: string; onPress: () => void }) => (
    <Press onPress={onPress} radius={S.xl} squish={0.97} accessibilityLabel={title} style={[st.choice, { backgroundColor: c.surfaceContainerLow, borderColor: c.outlineVariant }]}>
      <View style={[st.choiceIcon, { backgroundColor: c.secondaryContainer }]}>
        <Icon name={icon} size={28} color={c.onSecondaryContainer} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[T.titleMedium, { color: c.onSurface }]}>{title}</Text>
        <Text style={[T.bodyMedium, { color: c.onSurfaceVariant, marginTop: 2 }]}>{text}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={c.onSurfaceVariant} />
    </Press>
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={st.backdrop}>
        <View style={[st.card, { backgroundColor: c.surface, marginBottom: insets.bottom + 16 }]}>
          {page === 'choose' ? (
            <>
              <View style={[st.badge, { backgroundColor: c.primary }]}>
                <Icon name="camera-front-variant" size={30} color={c.onPrimary} />
              </View>
              <Text style={[T.headlineSmall, { color: c.onSurface, textAlign: 'center', marginTop: 14 }]}>How do you want your selfie?</Text>
              <Text style={[T.bodyMedium, { color: c.onSurfaceVariant, textAlign: 'center', marginTop: 6, marginBottom: 18 }]}>
                After the back photo, StormSnap turns to the front camera. You can change this later under Me.
              </Text>
              <View style={{ gap: 10 }}>
                <Choice icon="timer-outline" title="Automatic" text="The selfie takes itself after a few seconds" onPress={() => setPage('seconds')} />
                <Choice
                  icon="gesture-tap-button"
                  title="Myself, with the button"
                  text={`You get ${SELFIE_BUTTON_SECONDS} seconds to tap the button`}
                  onPress={() => onDone({ mode: 'button', delay: 0 })}
                />
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => setPage('choose')} hitSlop={10} accessibilityLabel="Back" style={{ alignSelf: 'flex-start' }}>
                <Icon name="arrow-left" size={24} color={c.onSurface} />
              </Pressable>
              <Text style={[T.headlineSmall, { color: c.onSurface, textAlign: 'center', marginTop: 4 }]}>After how many seconds?</Text>
              <Text style={[T.bodyMedium, { color: c.onSurfaceVariant, textAlign: 'center', marginTop: 6, marginBottom: 20 }]}>
                You see a big countdown, then the selfie is taken.
              </Text>
              <View style={st.delays}>
                {DELAYS.map((d) => {
                  const on = d === delay;
                  return (
                    <Press
                      key={d}
                      onPress={() => {
                        haptic();
                        setDelay(d);
                      }}
                      radius={S.lg}
                      squish={0.9}
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${d} seconds`}
                      style={[st.delay, { backgroundColor: on ? c.primary : c.surfaceContainerLow, borderColor: on ? c.primary : c.outlineVariant }]}
                    >
                      <Text style={[T.headlineSmall, T.num, { color: on ? c.onPrimary : c.onSurface }]}>{d}</Text>
                      <Text style={[T.labelMedium, { color: on ? c.onPrimary : c.onSurfaceVariant }]}>sec</Text>
                    </Press>
                  );
                })}
              </View>
              <Button title="Done" icon="check" big onPress={() => onDone({ mode: 'auto', delay })} style={{ marginTop: 22 }} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', paddingHorizontal: 12 },
  card: { borderRadius: 32, padding: 22, maxWidth: 520, width: '100%', alignSelf: 'center' },
  badge: { width: 60, height: 60, borderRadius: S.xl, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: 1.5 },
  choiceIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  delays: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  delay: { width: 58, height: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
