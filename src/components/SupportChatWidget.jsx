import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const AGENT_NAME = 'sensei_support';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2 mb-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs">⛩️</span>
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-0.5">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="my-0">{children}</li>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        try {
          const me = await base44.auth.me();
          setUser(me);
        } catch (_) {}
      }
    });
  }, []);

  // Timed nudge — show after 30 seconds if chat hasn't been opened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open && !nudgeDismissed) setShowNudge(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Hide nudge when chat opens
  useEffect(() => {
    if (open) setShowNudge(false);
  }, [open]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsubscribe;
  }, [conversation?.id]);

  const buildUserContext = (u) => {
    if (!u) return { visitor_type: 'guest', is_authenticated: false };
    const isPro = u.role === 'admin' || (u.subscription_tier === 'pro' && u.subscription_status === 'active');
    return {
      visitor_type: u.role === 'admin' ? 'admin' : isPro ? 'black_belt_customer' : 'white_belt_customer',
      is_authenticated: true,
      plan: isPro ? 'Black Belt' : 'White Belt',
      subscription_tier: u.subscription_tier || 'free',
      subscription_status: u.subscription_status || 'none',
      user_name: u.full_name || u.email,
      user_email: u.email,
      role: u.role,
    };
  };

  const initConversation = async () => {
    if (conversation) return;
    setInitializing(true);
    try {
      const userContext = buildUserContext(user);
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          name: 'Support Chat',
          user_context: userContext,
        },
      });
      setConversation(conv);
      setMessages(conv.messages || []);

      // Inject a hidden system context message so the agent knows who it's speaking to
      const contextLine = userContext.is_authenticated
        ? `[SYSTEM CONTEXT — NOT VISIBLE TO USER]: The person chatting is ${userContext.user_name} (${userContext.user_email}), a registered QR Sensei customer on the **${userContext.plan}** plan (status: ${userContext.subscription_status}). ${userContext.plan === 'Black Belt' ? 'They are a paid Black Belt member — treat them as a high-priority customer and offer full feature assistance including creating QR codes on their behalf if requested.' : 'They are on the free White Belt plan — you can helpfully guide them toward upgrading where relevant.'}`
        : `[SYSTEM CONTEXT — NOT VISIBLE TO USER]: The person chatting is an anonymous visitor or prospect, not yet logged in. They are browsing the QR Sensei website. Focus on answering general questions, explaining features and plans, and guiding them toward signing up.`;

      await base44.agents.addMessage(conv, { role: 'user', content: contextLine });
    } catch (e) {
      console.error('Failed to create conversation', e);
    } finally {
      setInitializing(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!conversation) initConversation();
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter out the hidden system context message injected at conversation start
  const visibleMessages = messages.filter(
    (m) => (m.role === 'user' && !m.content?.startsWith('[SYSTEM CONTEXT')) || (m.role === 'assistant' && m.content)
  );

  const isStreaming = messages.some(
    (m) => m.role === 'assistant' && !m.content && m.status !== 'done'
  );

  return (
    <>
      {/* Nudge prompt */}
      {showNudge && !open && (
        <div className="fixed bottom-24 right-6 z-50 w-64 bg-white rounded-2xl shadow-xl border border-border p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button
            onClick={() => { setShowNudge(false); setNudgeDismissed(true); }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs font-semibold text-foreground mb-1">👋 Need help?</p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            I can answer questions about features, plans, upgrades, and more.
          </p>
          <button
            onClick={() => { setShowNudge(false); setNudgeDismissed(true); handleOpen(); }}
            className="w-full bg-primary text-primary-foreground text-xs font-semibold rounded-lg py-2 hover:bg-primary/90 transition-colors"
          >
            Chat with QR Sensei Master
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="Open support chat"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">
              ⛩️
            </div>
            <div>
              <p className="text-primary-foreground font-semibold text-sm leading-tight">QR Sensei Master</p>
              <p className="text-primary-foreground/70 text-xs">Ask me anything</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {initializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {visibleMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-xs mt-8 px-4">
                    <p className="text-2xl mb-2">⛩️</p>
                    <p className="font-medium text-sm text-foreground mb-1">Welcome to the Dojo</p>
                    <p>Ask me about plans, features, billing, or anything QR Sensei — I'm here to help.</p>
                  </div>
                )}
                {visibleMessages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {(isStreaming || sending) && (
                  <div className="flex gap-2 mb-3 justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs">⛩️</span>
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2 shrink-0 flex gap-2 items-end">
            {!user ? (
              <div className="w-full text-center text-xs text-muted-foreground py-2 space-y-1">
                <p>You are chatting as a <span className="font-medium text-foreground">guest visitor</span>.</p>
                <p>
                  <button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="text-primary underline font-medium"
                  >
                    Log in
                  </button>{' '}
                  to get personalized account help.
                </p>
              </div>
            ) : (
              <>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  rows={1}
                  className="flex-1 resize-none text-sm bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 max-h-24 min-h-[36px]"
                  disabled={sending || initializing}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || initializing || !conversation}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}