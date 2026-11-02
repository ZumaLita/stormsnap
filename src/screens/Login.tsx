import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { R, T, useStyles, useTheme, type Theme } from '../theme';
import { login, niceError, type Me } from '../api';

export function Login({ onDone }: { onDone: (me: Me, code: string) => void }) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const pinRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const submit = async () => {
    if (!code.trim() || !name.trim() || pin.length < 4) {
      setError('Fill in the family code, your name and your PIN.');
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

  const field = (label: string, el: React.ReactNode, last?: boolean) => (
    <View style={[s.field, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator }]}>
      <Text style={[T.body, { color: c.label, width: 96 }]}>{label}</Text>
      {el}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[s.wrap, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/icon.png')} style={s.icon} />
        <Text style={[T.largeTitle, { color: c.label, textAlign: 'center', marginTop: 20 }]}>StormSnap</Text>
        <Text style={[T.body, { color: c.secondary, textAlign: 'center', marginTop: 6, marginBottom: 32 }]}>
          Your family, every hour.{'\n'}Back camera and selfie, together.
        </Text>

        <View style={s.group}>
          {field(
            'Family',
            <TextInput
              style={s.input}
              placeholder="GEES-0000"
              placeholderTextColor={c.tertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={() => nameRef.current?.focus()}
            />,
          )}
          {field(
            'Name',
            <TextInput
              ref={nameRef}
              style={s.input}
              placeholder="Your name"
              placeholderTextColor={c.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => pinRef.current?.focus()}
            />,
          )}
          {field(
            'PIN',
            <TextInput
              ref={pinRef}
              style={s.input}
              placeholder="••••"
              placeholderTextColor={c.tertiary}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, ''))}
              onSubmitEditing={submit}
            />,
            true,
          )}
        </View>
        {!!error && <Text style={[T.footnote, { color: c.red, marginTop: 10, marginHorizontal: 16 }]}>{error}</Text>}

        <Button title="Continue" busy={busy} onPress={submit} style={{ marginTop: 24 }} />
        <Text style={[T.footnote, { color: c.secondary, textAlign: 'center', marginTop: 16 }]}>No email needed. Ask Storm for your code and PIN.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
    icon: { width: 88, height: 88, borderRadius: 20, alignSelf: 'center' },
    group: { backgroundColor: c.card, borderRadius: R.card, overflow: 'hidden' },
    field: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 50 },
    input: { flex: 1, height: 50, paddingRight: 16, color: c.label, ...T.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) } as never,
  });
