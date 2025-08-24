import { useCallback, useState } from 'react';
import messageService, { Conversation, CreateConversationRequest, Message, SendMessageRequest } from '../services/messageService';

interface UseMessagingReturn {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (conversationId: string, data: SendMessageRequest) => Promise<boolean>;
  createConversation: (data: CreateConversationRequest) => Promise<boolean>;
  clearError: () => void;
}

export const useMessaging = (): UseMessagingReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getConversations({ limit: 20 });
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getConversationWithMessages(conversationId, { limit: 50 });
      if (response.success) {
        setMessages(response.messages.reverse()); // Show newest first
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setSelectedConversation(conversation);
    if (conversation) {
      loadMessages(conversation.conversationId);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  const sendMessage = useCallback(async (conversationId: string, data: SendMessageRequest): Promise<boolean> => {
    try {
      setSending(true);
      setError(null);
      
      const response = await messageService.sendMessage(conversationId, data);
      if (response.success) {
        setMessages(prev => [response.message, ...prev]);
        // Refresh conversation list to update last message
        await loadConversations();
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setSending(false);
    }
  }, [loadConversations]);

  const createConversation = useCallback(async (data: CreateConversationRequest): Promise<boolean> => {
    try {
      setSending(true);
      setError(null);
      
      const response = await messageService.createConversation(data);
      if (response.success) {
        setConversations(prev => [response.conversation, ...prev]);
        setSelectedConversation(response.conversation);
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    error,
    loadConversations,
    loadMessages,
    selectConversation,
    sendMessage,
    createConversation,
    clearError,
  };
};
