import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PillButton, RoundButton } from '../components/ui';
import { C, F } from '../theme';
import { niceError, postSnap, type Me } from '../api';

type Step = 'back' | 'front' | 'review' | 'posting';

async function shrink(uri: string, width: number) {
  try {
    const ctx = ImageManipulator.manipulate(uri).resize({ width });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: 0.62, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return uri;
  }
}

export function Camera({
  me,
  onTime,
  onClose,
  onPosted,
}: {
  me: Me;
  onTime: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const ready = useRef<(() => void) | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [step, setStep] = useState<Step>('back');
  const [back, setBack] = useState<string | null>(null);
  const [front, setFront] = useState<string | null>(null);
  const [swapped, setSwapped] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const waitReady = () =>
    new Promise<void>((res) => {
      ready.current = res;
      setTimeout(res, 1600);
    });

  const shoot = async () => {
    if (!cam.current || step !== 'back') return;
    setError('');
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const b = await cam.current.takePictureAsync({ quality: 0.8 });
      setBack(b.uri);
      setStep('front');
      const waiting = waitReady();
      setFacing('front');
      await waiting;
      await new Promise((r) => setTimeout(r, 350));
      const f = await cam.current!.takePictureAsync({ quality: 0.8 });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const [bs, fs] = await Promise.all([shrink(b.uri, 1080), shrink(f.uri, 720)]);
      setBack(bs);
      setFront(fs);
      setStep('review');
    } catch (e) {
      setError(niceError(e));
      retake();
    }
  };

  const retake = () => {
    setBack(null);
    setFront(null);
    setFacing('back');
    setSwapped(false);
    setStep('back');
  };

  const post = async () => {
    if (!back || !front) return;
    setStep('posting');
    setError('');
    try {
      await postSnap(me, back, front, caption, onTime);
      onPosted();
    } catch (e) {
      setError(niceError(e));
      setStep('review');
    }
  };

  if (!perm) return <View style={styles.black} />;

  if (!perm.granted)
    return (
      <View style={[styles.black, styles.center, { padding: 32 }]}>
        <Text style={styles.permTitle}>StormSnap needs your camera</Text>
        <Text style={styles.permText}>It takes one photo with the back camera and one with the front.</Text>
        <PillButton title="Allow camera" onPress={requestPerm} style={{ marginTop: 20 }} />
        <PillButton title="Not now" dark onPress={onClose} style={{ marginTop: 10 }} />
      </View>
    );

  const reviewing = step === 'review' || step === 'posting';
  const big = swapped ? front : back;
  const small = swapped ? back : front;

  return (
    <View style={styles.black}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.frame, { marginTop: insets.top + 8 }]}>
          {!reviewing ? (
            <CameraView
              ref={cam}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mirror={facing === 'front'}
              animateShutter={false}
              onCameraReady={() => {
                ready.current?.();
                ready.current = null;
              }}
            />
          ) : (
            big && <Image source={{ uri: big }} style={StyleSheet.absoluteFill} />
          )}

          {(back && step === 'front') || reviewing ? (
            <Pressable style={styles.inset} onPress={() => reviewing && setSwapped((s) => !s)}>
              {reviewing ? (
                small && <Image source={{ uri: small }} style={StyleSheet.absoluteFill} />
              ) : (
                back && <Image source={{ uri: back }} style={StyleSheet.absoluteFill} />
              )}
            </Pressable>
          ) : null}

          <View style={styles.topBar}>
            <RoundButton icon="close" dark onPress={onClose} label="Close" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {step === 'back' ? 'Back camera' : step === 'front' ? 'Now smile!' : onTime ? 'On time' : 'Extra snap'}
              </Text>
            </View>
            <View style={{ width: 46 }} />
          </View>

          {step === 'front' && (
            <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
              <ActivityIndicator color={C.white} size="large" />
            </View>
          )}
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!reviewing ? (
            <Pressable
              onPress={shoot}
              disabled={step !== 'back'}
              style={({ pressed }) => [styles.shutter, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
              accessibilityLabel="Take snap"
            >
              <View style={styles.shutterInner} />
            </Pressable>
          ) : (
            <>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                maxLength={140}
                style={styles.caption}
              />
              <View style={styles.row}>
                <PillButton title="Retake" icon="refresh" onPress={retake} style={{ flex: 1 }} />
                <PillButton
                  title="Post"
                  icon="send"
                  busy={step === 'posting'}
                  onPress={post}
                  style={{ flex: 1, backgroundColor: C.accent }}
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#0D0B0C' },
  center: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1d191b',
    maxWidth: 520,
    width: '95%',
    alignSelf: 'center',
  },
  inset: {
    position: 'absolute',
    top: 78,
    left: 14,
    width: 110,
    height: 146,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: C.white,
    backgroundColor: '#333',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: { backgroundColor: 'rgba(20,17,19,0.45)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  badgeText: { color: C.white, fontFamily: F.semibold, fontSize: 13 },
  bottom: { paddingTop: 18, paddingHorizontal: 18, alignItems: 'center', gap: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent },
  caption: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: C.white,
    fontFamily: F.medium,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  error: { color: '#FFB3C8', fontFamily: F.medium, fontSize: 13, textAlign: 'center' },
  permTitle: { color: C.white, fontFamily: F.bold, fontSize: 22, textAlign: 'center' },
  permText: { color: 'rgba(255,255,255,0.7)', fontFamily: F.regular, fontSize: 15, textAlign: 'center', marginTop: 8 },
});
