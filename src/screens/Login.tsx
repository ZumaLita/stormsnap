import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Shape, type IconName } from '../components/ui';
import { S, T, useStyles, useTheme, type Theme } from '../theme';
import { login, niceError, type Me } from '../api';

type InputRef = React.ElementRef<typeof TextInput>;

function Field({
  label,
  icon,
  inputRef,
  ...props
}: { label: string; icon: IconName; inputRef?: React.Ref<InputRef> } & React.ComponentProps<typeof TextInput>) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const [focus, setFocus] = useState(false);
  return (
    <View style={[s.field, { borderColor: focus ? c.primary : c.outline, borderWidth: focus ? 2 : 1 }]}>
      <Icon name={icon} size={24} color={focus ? c.primary : c.onSurfaceVariant} />
      <View style={{ flex: 1 }}>
        <Text style={[T.bodySmall, { color: focus ? c.primary : c.onSurfaceVariant }]}>{label}</Text>
        <TextInput ref={inputRef} style={s.input} placeholderTextColor={c.outline} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} {...props} />
      </View>
    </View>
  );
}

export function Login({ onDone }: { onDone: (me: Me, code: string) => void }) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<InputRef>(null);
  const pinRef = useRef<InputRef>(null);

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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView contentContainerStyle={[s.wrap, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Shape kind="burst" size={112} color={c.primaryContainer} style={{ alignSelf: 'center' }}>
          <Icon name="camera" size={48} color={c.onPrimaryContainer} />
        </Shape>
        <Text style={[T.displayMedium, { color: c.onSurface, textAlign: 'center', marginTop: 24, fontWeight: '700' }]}>StormSnap</Text>
        <Text style={[T.bodyLarge, { color: c.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 32 }]}>
          Your family, every hour.{'\n'}Back camera and selfie, together.
        </Text>

        <View style={{ gap: 12 }}>
          <Field label="Family code" icon="home-heart" placeholder="GEES-0000" autoCapitalize="characters" autoCorrect={false} returnKeyType="next" value={code} onChangeText={setCode} onSubmitEditing={() => nameRef.current?.focus()} />
          <Field label="Your name" icon="account-outline" inputRef={nameRef} placeholder="Storm" autoCapitalize="words" autoCorrect={false} returnKeyType="next" value={name} onChangeText={setName} onSubmitEditing={() => pinRef.current?.focus()} />
          <Field label="PIN" icon="lock-outline" inputRef={pinRef} placeholder="••••" keyboardType="number-pad" secureTextEntry maxLength={8} value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, ''))} onSubmitEditing={submit} />
        </View>
        {!!error && (
          <View style={[s.error, { backgroundColor: c.errorContainer }]}>
            <Icon name="alert-circle-outline" size={20} color={c.onErrorContainer} />
            <Text style={[T.bodyMedium, { color: c.onErrorContainer, flex: 1 }]}>{error}</Text>
          </View>
        )}

        <Button title="Join the family" icon="arrow-right" big busy={busy} onPress={submit} style={{ marginTop: 24 }} />
        <Text style={[T.bodySmall, { color: c.onSurfaceVariant, textAlign: 'center', marginTop: 16 }]}>No email needed. Ask Storm for your code and PIN.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
    field: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderRadius: S.xs, paddingHorizontal: 12 },
    input: { color: c.onSurface, ...T.bodyLarge, paddingVertical: 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) } as never,
    error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: S.md, padding: 12, marginTop: 12 },
  });
