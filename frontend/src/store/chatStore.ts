import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Citation, ChatResponsePayload } from "@/lib/api";
import { toast } from "sonner";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type Conversation = ConversationRow;
export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  artifacts?: ChatResponsePayload["artifacts"] | null;
  citations?: Citation[];
};

interface ChatStoreState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: StoredMessage[];
  artifacts: ChatResponsePayload["artifacts"] | null;
  citations: Citation[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  loadConversations: (userId: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createConversation: (userId: string) => Promise<string | null>;
  appendMessage: (message: StoredMessage, persist?: boolean) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  resetChatState: () => void;
  clearSelection: () => void;
}

const toStoredMessage = (row: MessageRow): StoredMessage => ({
  id: row.id,
  role: row.role as "user" | "assistant",
  content: row.content,
  createdAt: row.created_at,
  artifacts: row.artifacts ? (row.artifacts as unknown as ChatResponsePayload["artifacts"]) : null,
  citations: row.citations ? (row.citations as unknown as Citation[]) : undefined,
});

export const useChatStore = create<ChatStoreState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  artifacts: null,
  citations: [],
  loadingConversations: false,
  loadingMessages: false,

  loadConversations: async (userId: string) => {
    set({ loadingConversations: true });
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load conversations");
      set({ loadingConversations: false });
      return;
    }

    set({ conversations: data || [], loadingConversations: false });
  },

  selectConversation: async (conversationId: string) => {
    const state = get();
    if (state.currentConversationId === conversationId) return;

    set({ loadingMessages: true });
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load messages");
      set({ loadingMessages: false });
      return;
    }

    const messages = data.map(toStoredMessage);
    // Get artifacts and citations from the last assistant message
    const lastAssistantMessage = messages.reverse().find((m) => m.role === "assistant");
    messages.reverse();

    set({
      currentConversationId: conversationId,
      messages,
      artifacts: lastAssistantMessage?.artifacts ?? null,
      citations: lastAssistantMessage?.citations ?? [],
      loadingMessages: false,
    });
  },

  createConversation: async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: "New conversation" })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create conversation");
      return null;
    }

    set((state) => ({
      conversations: [data, ...state.conversations],
      currentConversationId: data.id,
      messages: [],
      artifacts: null,
      citations: [],
    }));

    return data.id;
  },

  appendMessage: async (message: StoredMessage, persist = true) => {
    const conversationId = get().currentConversationId;
    if (!conversationId) return;

    set((state) => ({ 
      messages: [...state.messages, message],
      // Update current artifacts/citations if this is an assistant message
      ...(message.role === "assistant" && {
        artifacts: message.artifacts ?? state.artifacts,
        citations: message.citations ?? state.citations,
      }),
    }));

    if (persist) {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        artifacts: (message.artifacts ?? null) as any,
        citations: (message.citations ?? null) as any,
      });

      if (error) {
        toast.error("Failed to save message");
        return;
      }

      // Auto-generate title from first user message
      const state = get();
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation?.title === "New conversation" && message.role === "user" && state.messages.length === 1) {
        const autoTitle = message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "");
        await get().updateConversationTitle(conversationId, autoTitle);
      }

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, updated_at: message.createdAt }
            : conversation,
        ),
      }));
    }
  },


  updateConversationTitle: async (conversationId: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const { error } = await supabase.from("conversations").update({ title: trimmedTitle }).eq("id", conversationId);
    if (error) {
      toast.error("Failed to update conversation title");
      return;
    }

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, title: trimmedTitle } : conversation,
      ),
    }));
  },

  deleteConversation: async (conversationId: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) {
      toast.error("Failed to delete conversation");
      return;
    }

    toast.success("Conversation deleted");
    set((state) => {
      const remaining = state.conversations.filter((conversation) => conversation.id !== conversationId);
      const currentConversationId = state.currentConversationId === conversationId ? null : state.currentConversationId;
      return {
        conversations: remaining,
        currentConversationId,
        messages: currentConversationId ? state.messages : [],
        artifacts: currentConversationId ? state.artifacts : null,
        citations: currentConversationId ? state.citations : [],
      };
    });
  },

  resetChatState: () => {
    set({
      conversations: [],
      currentConversationId: null,
      messages: [],
      artifacts: null,
      citations: [],
    });
  },

  clearSelection: () => {
    set({
      currentConversationId: null,
      messages: [],
      artifacts: null,
      citations: [],
    });
  },
}));
