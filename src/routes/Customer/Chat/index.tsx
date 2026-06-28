import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { format } from 'date-fns';
import { Header } from '@components/common';
import { supabase } from '@library/supabase';
import { subscribeToMessages } from '@store/Chat/api';
import * as ChatActions from '@store/Chat/actions';

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...ChatActions });

function Chat({ navigation, route, user, getMessages, sendMessage }) {
  const { orderId, otherName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const scrollEnd = () => setTimeout(() => listRef.current && listRef.current.scrollToEnd({ animated: true }), 100);

  useEffect(() => {
    getMessages(orderId).then((m) => { setMessages(m); scrollEnd(); });
    const channel = subscribeToMessages(orderId, (msg) => {
      setMessages((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, msg]));
      scrollEnd();
    });
    return () => supabase.removeChannel(channel);
  }, [orderId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try { await sendMessage(orderId, user.id, body); } catch { setText(body); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={otherName || 'Chat'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={hp(11)} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollEnd}
          renderItem={({ item }) => {
            const mine = item.sender_id === (user && user.id);
            return (
              <View style={[styles.row, mine ? styles.right : styles.left]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.text, mine && styles.textMine]}>{item.message}</Text>
                  <Text style={[styles.time, mine && styles.timeMine]}>{format(new Date(item.created_at), 'h:mm a')}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputBar}>
          <TextInput value={text} onChangeText={setText} placeholder="Type a message..." placeholderTextColor={colors.placeholder} style={styles.input} multiline />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, !text.trim() && styles.sendDisabled]} disabled={!text.trim()}>
            <Icon name="send" size={wp(4.5)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default enhancer(Chat);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  list: {
    padding: wp(5),
    flexGrow: 1
  },
  row: {
    marginBottom: hp(1.2),
    maxWidth: '80%'
  },
  right: {
    alignSelf: 'flex-end'
  },
  left: {
    alignSelf: 'flex-start'
  },
  bubble: {
    borderRadius: wp(4),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2)
  },
  mine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: wp(1)
  },
  theirs: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: wp(1)
  },
  text: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  textMine: {
    color: colors.white
  },
  time: {
    fontWeight: Regular,
    fontSize: wp(2.5),
    color: colors.txtTertiary,
    marginTop: 3,
    alignSelf: 'flex-end'
  },
  timeMine: {
    color: 'rgba(255,255,255,0.8)'
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp(2.5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    paddingBottom: hp(3.5),
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  input: {
    flex: 1,
    maxHeight: hp(12),
    backgroundColor: colors.surface,
    borderRadius: wp(5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  sendBtn: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(5.25),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendDisabled: {
    backgroundColor: colors.placeholder
  }
});
