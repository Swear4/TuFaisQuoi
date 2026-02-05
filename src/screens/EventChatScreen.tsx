import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Message } from '../types';

export default function EventChatScreen({ route, navigation }: any) {
  const { eventId, eventTitle, eventDate } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Check if archived (J+1 after event date)
  const isArchived = React.useMemo(() => {
    if (!eventDate) return false;
    const eventEnd = new Date(eventDate);
    eventEnd.setDate(eventEnd.getDate() + 1); // J+1
    return new Date() > eventEnd;
  }, [eventDate]);

  useEffect(() => {
    fetchMessages();
    const subscription = subscribeToMessages();
    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users (
            name,
            avatar_url
          )
        `) // Assuming 'users' table is linked publicly or we use metadata? 
           // If 'users' table is not public readable, we might rely on client side mapping or metadata.
           // For this MVP, let's assume we can join or we just use the user_id for now if join fails.
           // In Supabase, usually public.users profile pattern is used.
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback if join fails (e.g. RLS on users table)
      // We'll just load messages without user details if that fails, but here we just log.
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    return supabase
      .channel(`event_chat:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch the full message to get user details
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:users (
                name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (!error && data) {
            setMessages((prev) => [data, ...prev]);
          }
        }
      )
      .subscribe();
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    
    setSending(true);
    try {
      // Optimistic update? Maybe later.
      const { error } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          user_id: user?.id,
          content: inputText.trim(),
        });

      if (error) throw error;
      setInputText('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.user_id === user?.id;
    // Fallback if user join failed
    const userName = item.user?.name || item.user_id?.substring(0, 6) || 'Utilisateur';
    const avatar = item.user?.avatar_url;
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[
        styles.messageContainer, 
        isMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[
          styles.bubble, 
          isMe ? styles.myBubble : styles.otherBubble
        ]}>
          {!isMe && <Text style={styles.senderName}>{userName}</Text>}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.otherTimeText]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
          <Text style={styles.headerSubtitle}>
             {isArchived ? '🔒 Discussion archivée' : '👥 Discussion de l\'événement'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message pour le moment.</Text>
              <Text style={styles.emptySubText}>Lancez la discussion ! 👋</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      {!isArchived ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Écrivez un message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputText.trim() || sending) && styles.sendButtonDisabled
              ]} 
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.archivedBanner}>
          <Text style={styles.archivedText}>Cette discussion est fermée.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backArrow: {
    fontSize: 24,
    color: Colors.text,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    transform: [{ scaleY: -1 }], // Because list is inverted
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 12, // Align with bubble topish
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    color: Colors.textSecondary, // Different for dark mode?
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimeText: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    maxHeight: 100,
    color: Colors.text,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  archivedBanner: {
    padding: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  archivedText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
