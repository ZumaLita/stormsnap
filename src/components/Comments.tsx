import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon, Press } from './ui';
import { S, T, useTheme } from '../theme';
import { addComment, deleteComment, niceError, toggleCommentLike, type Comment, type Me, type Snap } from '../api';

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** Top comments with their replies right under them. Replies to a reply don't exist. */
export function threads(list: Comment[]) {
  // A reply whose comment was deleted is simply not shown.
  return list.filter((c) => !c.parentId).map((c) => ({ comment: c, replies: list.filter((r) => r.parentId === c.$id) }));
}

function Row({
  c,
  meId,
  reply,
  onLike,
  onReply,
  onDelete,
}: {
  c: Comment;
  meId: string;
  reply?: boolean;
  onLike: () => void;
  onReply?: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  const liked = c.likes.includes(meId);
  return (
    <View style={[st.row, reply && st.reply]}>
      <Avatar id={c.authorId} name={c.authorName} size={reply ? 28 : 34} />
      <View style={{ flex: 1 }}>
        <View style={[st.bubble, { backgroundColor: t.surfaceContainerHigh }]}>
          <Text style={[T.labelLarge, { color: t.onSurface }]}>{c.authorId === meId ? 'You' : c.authorName}</Text>
          <Text style={[T.bodyLarge, { color: t.onSurface, marginTop: 1 }]}>{c.text}</Text>
        </View>
        <View style={st.meta}>
          <Text style={[T.labelMedium, { color: t.onSurfaceVariant }]}>{ago(c.$createdAt)}</Text>
          {onReply && (
            <Pressable onPress={onReply} hitSlop={8} accessibilityLabel={`Reply to ${c.authorName}`}>
              <Text style={[T.labelLarge, { color: t.onSurfaceVariant }]}>Reply</Text>
            </Pressable>
          )}
          {c.authorId === meId && (
            <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Delete comment">
              <Text style={[T.labelLarge, { color: t.onSurfaceVariant }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Press onPress={onLike} radius={20} squish={0.8} accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'} style={st.like}>
        <Icon name={liked ? 'heart' : 'heart-outline'} size={reply ? 18 : 20} color={liked ? '#FF3B5C' : t.onSurfaceVariant} />
        {c.likes.length > 0 && <Text style={[T.labelSmall, T.num, { color: t.onSurfaceVariant }]}>{c.likes.length}</Text>}
      </Press>
    </View>
  );
}

export function CommentsSheet({
  me,
  snap,
  comments,
  onClose,
  onChange,
}: {
  me: Me;
  snap: Snap | null;
  comments: Comment[];
  onClose: () => void;
  onChange: (next: Comment[]) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const input = useRef<React.ElementRef<typeof TextInput>>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!snap) return null;
  const list = threads(comments);

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const c = await addComment(me, snap.$id, text, replyTo);
      onChange([...comments, c]);
      setText('');
      setReplyTo(null);
    } catch (e) {
      setError(niceError(e));
    } finally {
      setBusy(false);
    }
  };

  const like = async (c: Comment) => {
    const optimistic = { ...c, likes: c.likes.includes(me.id) ? c.likes.filter((x) => x !== me.id) : [...c.likes, me.id] };
    onChange(comments.map((x) => (x.$id === c.$id ? optimistic : x)));
    try {
      const saved = await toggleCommentLike(c, me.id);
      onChange(comments.map((x) => (x.$id === c.$id ? saved : x)));
    } catch {
      onChange(comments);
    }
  };

  const remove = (c: Comment) => {
    const go = async () => {
      try {
        await deleteComment(c);
        onChange(comments.filter((x) => x.$id !== c.$id));
      } catch (e) {
        setError(niceError(e));
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete your comment?')) go();
    } else
      Alert.alert('Delete comment?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: go },
      ]);
  };

  const reply = (c: Comment) => {
    setReplyTo(c);
    setTimeout(() => input.current?.focus(), 50);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.wrap} pointerEvents="box-none">
        <View style={[st.sheet, { backgroundColor: t.surfaceContainerLow, paddingBottom: insets.bottom + 10 }]}>
          <View style={[st.handle, { backgroundColor: t.outlineVariant }]} />
          <View style={st.head}>
            <Text style={[T.titleLarge, { color: t.onSurface, flex: 1 }]}>Comments</Text>
            <Text style={[T.labelLarge, { color: t.onSurfaceVariant }]}>{comments.length}</Text>
          </View>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {!list.length && (
              <View style={st.empty}>
                <Icon name="comment-text-outline" size={36} color={t.outline} />
                <Text style={[T.bodyLarge, { color: t.onSurfaceVariant, textAlign: 'center', marginTop: 8 }]}>
                  No comments yet.{'\n'}Say something nice to {snap.authorId === me.id ? 'the family' : snap.authorName}!
                </Text>
              </View>
            )}
            {list.map(({ comment, replies }) => (
              <View key={comment.$id}>
                <Row c={comment} meId={me.id} onLike={() => like(comment)} onReply={() => reply(comment)} onDelete={() => remove(comment)} />
                {replies.map((r) => (
                  // Replies get a like but no Reply button: no replies to replies.
                  <Row key={r.$id} c={r} meId={me.id} reply onLike={() => like(r)} onDelete={() => remove(r)} />
                ))}
              </View>
            ))}
          </ScrollView>

          {!!error && <Text style={[T.bodyMedium, { color: t.error, marginBottom: 6 }]}>{error}</Text>}
          {replyTo && (
            <View style={[st.replying, { backgroundColor: t.secondaryContainer }]}>
              <Icon name="reply" size={18} color={t.onSecondaryContainer} />
              <Text style={[T.labelLarge, { color: t.onSecondaryContainer, flex: 1 }]} numberOfLines={1}>
                Replying to {replyTo.authorId === me.id ? 'yourself' : replyTo.authorName}
              </Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={10} accessibilityLabel="Stop replying">
                <Icon name="close" size={18} color={t.onSecondaryContainer} />
              </Pressable>
            </View>
          )}
          <View style={st.inputRow}>
            <Avatar id={me.id} name={me.name} size={34} />
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : 'Add a comment…'}
              placeholderTextColor={t.outline}
              maxLength={300}
              multiline
              onSubmitEditing={send}
              blurOnSubmit
              returnKeyType="send"
              style={[T.bodyLarge, st.input, { color: t.onSurface, backgroundColor: t.surface, borderColor: t.outlineVariant }]}
            />
            <Press onPress={send} radius={22} squish={0.85} accessibilityLabel="Send comment" style={[st.send, { backgroundColor: text.trim() ? t.primary : t.surfaceContainerHigh }]}>
              {busy ? <ActivityIndicator color={t.onPrimary} /> : <Icon name="send" size={20} color={text.trim() ? t.onPrimary : t.outline} />}
            </Press>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', maxWidth: 560, width: '100%', alignSelf: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 28 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  reply: { marginLeft: 44 },
  bubble: { borderRadius: S.lg, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', maxWidth: '100%' },
  meta: { flexDirection: 'row', gap: 16, paddingHorizontal: 12, paddingTop: 4 },
  like: { width: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  replying: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 36, borderRadius: 18, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 4 },
  input: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  send: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
