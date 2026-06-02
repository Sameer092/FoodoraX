import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { chatService, OrderMessage } from '@services/chat.service';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/auth.store';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';

export function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, otherName } = route.params as { orderId: string; otherName?: string };
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    let mounted = true;
    chatService.getMessages(orderId).then((m) => {
      if (mounted) { setMessages(m); scrollToEnd(); }
    });

    const channel = chatService.subscribeToMessages(orderId, (msg) => {
      setMessages((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, msg]));
      scrollToEnd();
    });
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [orderId, scrollToEnd]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user) return;
    setText('');
    try {
      await chatService.sendMessage(orderId, user.id, body);
    } catch {
      setText(body); // restore on failure
    }
  };

  const renderItem = ({ item }: { item: OrderMessage }) => {
    const mine = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.message}</Text>
          <Text style={[styles.time, mine && styles.timeMine]}>
            {format(new Date(item.created_at), 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName ?? 'Chat'}</Text>
          <Text style={styles.headerSub}>Order chat</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.light.textTertiary} />
              <Text style={styles.emptyText}>Say hello! Messages are delivered instantly.</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.light.placeholder}
            style={styles.input}
            multiline
            onSubmitEditing={send}
          />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} disabled={!text.trim()}>
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  headerSub: { fontSize: 12, color: Colors.light.textSecondary },
  list: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.light.textTertiary, textAlign: 'center' },
  bubbleRow: { marginBottom: 10, maxWidth: '80%' },
  rowRight: { alignSelf: 'flex-end' },
  rowLeft: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: Colors.primary[500], borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.dark[900] },
  bubbleTextMine: { color: Colors.white },
  time: { fontSize: 10, color: Colors.light.textTertiary, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border,
  },
  input: {
    flex: 1, maxHeight: 100, backgroundColor: Colors.light.surface,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.dark[900],
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.light.placeholder },
});
