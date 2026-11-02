import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Background, Glass, PillButton } from '../components/ui';
import { F, useStyles, useTheme, type Theme } from '../theme';
import { login, niceError, type Me } from '../api';

function Field({
  icon,
  ...props
}: { icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={C.muted} />
      <TextInput placeholderTextColor={C.muted} style={styles.input} {...props} />
    </View>
  );
}

export function Login({ onDone }: { onDone: (me: Me, code: string) => void }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!code.trim() || !name.trim() || pin.length < 4) {
      setError('Fill in the family code, your name and your 4-digit PIN.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const me = await login(code, name, pin);
      onDone(me, code.trim());
    } catch (e) {
      setError(niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Background>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons name="camera" size={30} color={C.onAccent} />
          </View>
          <Text style={styles.h1}>
            Your family,{'\n'}
            <Text style={styles.h1Italic}>every hour</Text>
          </Text>
          <Text style={styles.sub}>Snap what you're doing with both cameras. Skipping is always fine.</Text>

          <Glass style={styles.card} strong>
            <Field icon="key-outline" placeholder="Family code" autoCapitalize="characters" value={code} onChangeText={setCode} />
            <Field icon="person-outline" placeholder="Your name" autoCapitalize="words" value={name} onChangeText={setName} />
            <Field
              icon="lock-closed-outline"
              placeholder="PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, ''))}
              onSubmitEditing={submit}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <PillButton title="Join the family" dark icon="arrow-forward" busy={busy} onPress={submit} style={{ marginTop: 6 }} />
          </Glass>
          <Text style={styles.foot}>No email needed. Ask Storm for your code and PIN.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
  wrap: { paddingHorizontal: 22, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  h1: { fontFamily: F.semibold, fontSize: 40, lineHeight: 46, color: C.headline, textShadowColor: C.headlineShadow, textShadowRadius: 12 },
  h1Italic: { fontFamily: F.lightItalic, color: C.headline },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.inkSoft, marginTop: 12, marginBottom: 28 },
  card: { padding: 16, gap: 10 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    backgroundColor: C.field,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  input: { flex: 1, height: '100%', fontFamily: F.medium, fontSize: 16, color: C.ink, outlineStyle: 'none' } as never,
  error: { fontFamily: F.medium, fontSize: 13, color: C.danger, paddingHorizontal: 6 },
  foot: { fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 18 },
});
