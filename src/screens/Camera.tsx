import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button, PressScale } from '../components/ui';
import { T, useTheme } from '../theme';
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
  const c = useTheme();
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
        <Ionicons name="camera-outline" size={56} color="rgba(235,235,245,0.6)" />
        <Text style={[T.title2, { color: '#FFFFFF', textAlign: 'center', marginTop: 16 }]}>Camera access</Text>
        <Text style={[T.body, { color: 'rgba(235,235,245,0.6)', textAlign: 'center', marginTop: 8 }]}>
          StormSnap takes one photo with the back camera and one with the front.
        </Text>
        <Button title="Allow camera" onPress={requestPerm} style={{ marginTop: 24, alignSelf: 'stretch' }} />
        <Button title="Not now" kind="plain" onPress={onClose} style={{ marginTop: 6, alignSelf: 'stretch' }} />
      </View>
    );

  const reviewing = step === 'review' || step === 'posting';
  const big = swapped ? front : back;
  const small = swapped ? back : front;
  const label = step === 'back' ? 'BACK' : step === 'front' ? 'SMILE' : onTime ? 'ON TIME' : 'EXTRA SNAP';

  return (
    <View style={styles.black}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.top, { paddingTop: insets.top + 4 }]}>
          <PressScale onPress={onClose} accessibilityLabel="Close" style={styles.circle}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </PressScale>
          <View style={[styles.mode, step === 'front' && { backgroundColor: '#FFD60A' }]}>
            <Text style={[T.caption2, { color: step === 'front' ? '#000' : '#FFD60A', fontWeight: '700', letterSpacing: 1 }]}>{label}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.frame}>
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
            <Pressable style={styles.inset} onPress={() => reviewing && setSwapped((x) => !x)} accessibilityLabel="Swap photos">
              {reviewing ? small && <Image source={{ uri: small }} style={StyleSheet.absoluteFill} /> : back && <Image source={{ uri: back }} style={StyleSheet.absoluteFill} />}
            </Pressable>
          ) : null}

          {step === 'front' && (
            <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
              <ActivityIndicator color="#FFFFFF" size="large" />
            </View>
          )}
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
          {!!error && <Text style={[T.footnote, { color: '#FF453A', textAlign: 'center' }]}>{error}</Text>}
          {!reviewing ? (
            <PressScale onPress={shoot} disabled={step !== 'back'} scaleTo={0.9} accessibilityLabel="Take snap" style={styles.shutter}>
              <View style={styles.shutterInner} />
            </PressScale>
          ) : (
            <>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption"
                placeholderTextColor="rgba(235,235,245,0.4)"
                maxLength={140}
                style={[styles.caption, T.body]}
              />
              <View style={styles.row}>
                <Button title="Retake" kind="gray" icon="refresh" onPress={retake} style={{ flex: 1, backgroundColor: 'rgba(118,118,128,0.3)' }} />
                <Button title="Post" icon="arrow-up" busy={step === 'posting'} onPress={post} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(118,118,128,0.3)', alignItems: 'center', justifyContent: 'center' },
  mode: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(118,118,128,0.3)' },
  frame: { flex: 1, marginHorizontal: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1C1C1E', maxWidth: 540, width: '94%', alignSelf: 'center' },
  inset: { position: 'absolute', top: 14, left: 14, width: 104, height: 138, borderRadius: 14, overflow: 'hidden', borderWidth: 2.5, borderColor: '#FFFFFF', backgroundColor: '#2C2C2E' },
  bottom: { paddingTop: 20, paddingHorizontal: 16, alignItems: 'center', gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  caption: { width: '100%', height: 48, borderRadius: 14, paddingHorizontal: 16, backgroundColor: 'rgba(118,118,128,0.24)', color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
});
