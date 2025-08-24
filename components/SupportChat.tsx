import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import messageService, { Conversation, Message } from '../services/messageService';

interface SupportChatProps {
  onClose?: () => void;
}

const SupportChat: React.FC<SupportChatProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    category: 'general' as const,
    description: '',
    priority: 'medium' as const,
  });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messageService.getConversations({ limit: 20 });
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await messageService.getConversationWithMessages(conversationId, { limit: 50 });
      if (response.success) {
        setMessages(response.messages.reverse()); // Show newest first
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedConversation) {
      await loadMessages(selectedConversation.conversationId);
    } else {
      await loadConversations();
    }
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await messageService.sendMessage(selectedConversation.conversationId, {
        content: messageText.trim(),
        type: 'text',
      });

      if (response.success) {
        setMessages(prev => [response.message, ...prev]);
        setMessageText('');
        // Refresh conversation list to update last message
        await loadConversations();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSending(false);
    }
  };

  const createNewTicket = async () => {
    if (!newTicketData.subject.trim() || !newTicketData.description.trim()) {
      Alert.alert(t('common.error'), t('supportChat.fillAllFields'));
      return;
    }

    try {
      setSending(true);
      const response = await messageService.createConversation(newTicketData);
      
      if (response.success) {
        setConversations(prev => [response.conversation, ...prev]);
        setSelectedConversation(response.conversation);
        setShowNewTicket(false);
        setNewTicketData({
          subject: '',
          category: 'general',
          description: '',
          priority: 'medium',
        });
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const file = {
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: result.assets[0].fileSize || 0,
        };

        // Upload file and send message
        try {
          setSending(true);
          const uploadResponse = await messageService.uploadAttachment(file);
          
          if (uploadResponse.success && selectedConversation) {
            const messageResponse = await messageService.sendMessage(selectedConversation.conversationId, {
              content: 'Image attachment',
              type: 'image',
              attachments: [{
                filename: uploadResponse.filename,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                url: uploadResponse.url,
              }],
            });

            if (messageResponse.success) {
              setMessages(prev => [messageResponse.message, ...prev]);
            }
          }
        } catch (error: any) {
          Alert.alert(t('common.error'), error.message);
        } finally {
          setSending(false);
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF9500';
      case 'in_progress':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      case 'closed':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#007AFF';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversation?.conversationId === item.conversationId && styles.selectedConversation,
      ]}
      onPress={() => setSelectedConversation(item)}
    >
      <View style={styles.conversationHeader}>
        <Text style={styles.conversationSubject} numberOfLines={1}>
          {item.ticket.subject}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.ticket.status) }]}>
          <Text style={styles.statusText}>{t(`supportChat.status.${item.ticket.status}`)}</Text>
        </View>
      </View>
      
      <Text style={styles.conversationDescription} numberOfLines={2}>
        {item.ticket.description}
      </Text>
      
      <View style={styles.conversationFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.ticket.priority) }]}>
          <Text style={styles.priorityText}>{t(`supportChat.priority.${item.ticket.priority}`)}</Text>
        </View>
        <Text style={styles.messageCount}>
          {item.metadata.messageCount} {t('supportChat.messages')}
        </Text>
        <Text style={styles.lastMessageTime}>
          {new Date(item.metadata.lastMessageAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender.role === 'user' ? styles.userMessage : styles.supportMessage,
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender.role === 'user' ? styles.userBubble : styles.supportBubble,
      ]}>
        <Text style={styles.messageSender}>{item.sender.name}</Text>
        <Text style={styles.messageContent}>{item.content}</Text>
        
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {item.attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentItem}>
                {attachment.mimeType.startsWith('image/') ? (
                  <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
                ) : (
                  <View style={styles.attachmentFile}>
                    <Text style={styles.attachmentFileName}>{attachment.originalName}</Text>
                    <Text style={styles.attachmentFileSize}>
                      {(attachment.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  if (showNewTicket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowNewTicket(false)}>
            <Text style={styles.backButton}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('supportChat.newTicket')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TextInput
            style={styles.input}
            placeholder={t('supportChat.subjectPlaceholder')}
            value={newTicketData.subject}
            onChangeText={(text) => setNewTicketData(prev => ({ ...prev, subject: text }))}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('supportChat.descriptionPlaceholder')}
            value={newTicketData.description}
            onChangeText={(text) => setNewTicketData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.sendButton, sending ? styles.disabledButton : null]}
            onPress={createNewTicket}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>{t('supportChat.createTicket')}</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (!selectedConversation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backButton}>{t('common.close')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('supportChat.title')}</Text>
          <TouchableOpacity onPress={() => setShowNewTicket(true)}>
            <Text style={styles.newTicketButton}>{t('supportChat.new')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversationId}
          style={styles.conversationList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loadingIndicator} size="large" />
            ) : (
              <Text style={styles.emptyText}>{t('supportChat.noConversations')}</Text>
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedConversation(null)}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedConversation.ticket.subject}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedConversation.ticket.status) }]}>
          <Text style={styles.statusText}>{t(`supportChat.status.${selectedConversation.ticket.status}`)}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messageList}
        inverted
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loadingIndicator} size="large" />
          ) : (
            <Text style={styles.emptyText}>{t('supportChat.noMessages')}</Text>
          )
        }
      />

      <KeyboardAvoidingView style={styles.inputContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Text style={styles.attachButtonText}>📎</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.messageInput}
          placeholder={t('supportChat.typeMessage')}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, (sending || !messageText.trim()) ? styles.disabledButton : null]}
          onPress={sendMessage}
          disabled={sending || !messageText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  newTicketButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedConversation: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conversationDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageCount: {
    fontSize: 12,
    color: '#666666',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999999',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  supportMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  supportBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageSender: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentItem: {
    marginTop: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  attachmentFile: {
    backgroundColor: '#F2F2F7',
    padding: 8,
    borderRadius: 8,
  },
  attachmentFileName: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  attachmentFileSize: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 20,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 50,
    fontSize: 16,
  },
});

export default SupportChat;
