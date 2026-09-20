import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { ConversationItem, MessageItem } from '../../types';
import { CompanyProfileModal } from '../../components/company/CompanyProfileModal';
import { WorkerProfileModal } from '../../components/worker/WorkerProfileModal';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Building2,
  Briefcase,
  CheckCheck,
  Loader2,
  Clock,
  ArrowLeft,
  Sparkles,
  Inbox
} from 'lucide-react';

export const Chatbox: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetJobParam = searchParams.get('job');
  const targetTitleParam = searchParams.get('title');

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(
    targetUserParam ? Number(targetUserParam) : null
  );
  const [activeUserName, setActiveUserName] = useState<string>('');
  const [activeUserRole, setActiveUserRole] = useState<string>('');
  const [activeJobTitle, setActiveJobTitle] = useState<string | undefined>(
    targetTitleParam || undefined
  );
  const [activeJobId, setActiveJobId] = useState<number | undefined>(
    targetJobParam ? Number(targetJobParam) : undefined
  );

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Profile modal state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenProfile = async () => {
    if (!activeUserId) return;
    try {
      let role = activeUserRole;
      if (!role) {
        const info = await messageService.getUserInfo(activeUserId);
        role = info.role;
        setActiveUserRole(role);
      }
      if (role === 'employer') {
        setShowCompanyModal(true);
      } else {
        setShowWorkerModal(true);
      }
    } catch (err) {
      console.error('Failed to open profile from chat', err);
    }
  };

  // 1. Fetch conversations list
  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
      return data;
    } catch (err) {
      console.error('Failed to load conversations', err);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  // 2. Fetch message history for selected conversation
  const loadMessages = async (otherId: number, isInitial = false) => {
    if (isInitial) setLoadingMessages(true);
    try {
      const data = await messageService.getChatHistory(otherId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages for user', otherId, err);
    } finally {
      if (isInitial) {
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations().then(async (threads) => {
      // If a user is specified in the URL
      if (targetUserParam) {
        const uid = Number(targetUserParam);
        const existing = threads.find((t) => t.other_user_id === uid);
        if (existing) {
          setActiveUserId(uid);
          setActiveUserName(existing.other_user_name);
          setActiveUserRole(existing.other_user_role);
          if (existing.job_title && !activeJobTitle) {
            setActiveJobTitle(existing.job_title);
          }
        } else {
          // New conversation inquiry: fetch user info
          try {
            const info = await messageService.getUserInfo(uid);
            setActiveUserId(uid);
            setActiveUserName(info.full_name);
            setActiveUserRole(info.role);
          } catch (e) {
            console.error('User not found', e);
          }
        }
      } else if (threads.length > 0 && !activeUserId) {
        // Auto-select first conversation thread
        const first = threads[0];
        setActiveUserId(first.other_user_id);
        setActiveUserName(first.other_user_name);
        setActiveUserRole(first.other_user_role);
        setActiveJobTitle(first.job_title);
      }
    });

    // Poll conversations list periodically
    const convInterval = setInterval(() => {
      loadConversations();
    }, 6000);

    return () => clearInterval(convInterval);
  }, [targetUserParam]);

  // When active user changes, load messages and set up message polling
  useEffect(() => {
    if (!activeUserId) return;

    loadMessages(activeUserId, true);

    const msgInterval = setInterval(() => {
      loadMessages(activeUserId, false);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSelectConversation = (thread: ConversationItem) => {
    setActiveUserId(thread.other_user_id);
    setActiveUserName(thread.other_user_name);
    setActiveUserRole(thread.other_user_role);
    setActiveJobTitle(thread.job_title);
    setSearchParams({ user: String(thread.other_user_id) });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeUserId || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await messageService.sendMessage({
        receiver_id: activeUserId,
        content,
        job_id: activeJobId
      });
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);
      loadConversations(); // update last message in sidebar
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.job_title && c.job_title.toLowerCase().includes(q)) ||
      c.last_message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Direct Communication
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              Chatbox & Inquiries
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Communicate directly with hiring employers and field workers regarding positions and availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={user?.role === 'employer' ? '/employer/workers' : '/worker/jobs'}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              {user?.role === 'employer' ? 'Browse Available Workers' : 'Search More Jobs'}
            </Link>
          </div>
        </div>

        {/* Chatbox Container */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px] max-h-[calc(100vh-210px)]">
          
          {/* Left Column: Conversations Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 bg-slate-900/90">
            
            {/* Search Box */}
            <div className="p-4 border-b border-slate-800/80">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search chats by name or job..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Conversation Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {loadingConversations ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-400">No active conversations found</p>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                    Messages from job applications or worker inquiries will appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map((thread) => {
                  const isSelected = activeUserId === thread.other_user_id;
                  const isEmployerParty = thread.other_user_role === 'employer';
                  const initial = thread.other_user_name ? thread.other_user_name[0].toUpperCase() : 'U';

                  return (
                    <button
                      key={thread.other_user_id}
                      onClick={() => handleSelectConversation(thread)}
                      className={`w-full text-left p-4 transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-800/60 border-l-4 border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0 text-sm">
                        {isEmployerParty ? <Building2 className="w-5 h-5" /> : initial}
                      </div>

                      {/* Info snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {thread.other_user_name}
                          </h4>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(thread.last_message_time).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {thread.job_title && (
                          <span className="text-[10px] font-medium text-indigo-400 block truncate mt-0.5">
                            Re: {thread.job_title}
                          </span>
                        )}

                        <p className="text-xs text-slate-400 truncate mt-1">
                          {thread.last_message}
                        </p>
                      </div>

                      {/* Unread Pill */}
                      {thread.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {thread.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Active Chat Panel */}
          <div className="flex-1 flex flex-col bg-slate-950/50">
            {activeUserId ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 px-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="flex items-center gap-3 text-left group cursor-pointer hover:opacity-90 transition"
                    title="Click to view full profile"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold group-hover:border-indigo-400 transition shrink-0">
                      {activeUserRole === 'employer' ? (
                        <Building2 className="w-5 h-5" />
                      ) : activeUserName ? (
                        activeUserName[0].toUpperCase()
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-300 group-hover:underline transition">
                          {activeUserName || 'Chat'}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {activeUserRole || 'User'}
                        </span>
                      </div>
                      {activeJobTitle ? (
                        <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5" /> Re: {activeJobTitle}
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Connection
                        </p>
                      )}
                    </div>
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                      Loading chat messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                      <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
                      <p className="text-sm font-semibold text-white">Start your conversation with {activeUserName}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Introduce yourself, ask about work timings, on-site requirements, or interview availability.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      const formattedTime = new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                            }`}
                          >
                            <p className="break-words leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 px-1">
                            <span>{formattedTime}</span>
                            {isMe && (
                              <CheckCheck
                                className={`w-3.5 h-3.5 ${m.is_read ? 'text-indigo-400' : 'text-slate-500'}`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Composer */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Send a message to ${activeUserName || 'contact'}...`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Your Chatbox</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a conversation from the sidebar to view message history, or chat directly from any job listing or candidate application.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* View Company Profile Modal */}
      {showCompanyModal && activeUserId && (
        <CompanyProfileModal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          employerId={activeUserId}
        />
      )}

      {/* View Worker Profile Modal */}
      {showWorkerModal && activeUserId && (
        <WorkerProfileModal
          isOpen={showWorkerModal}
          onClose={() => setShowWorkerModal(false)}
          workerUserId={activeUserId}
        />
      )}
    </div>
  );
};

