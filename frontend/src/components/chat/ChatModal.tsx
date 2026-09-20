import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { MessageItem } from '../../types';
import { CompanyProfileModal } from '../company/CompanyProfileModal';
import { WorkerProfileModal } from '../worker/WorkerProfileModal';
import {
  X,
  Send,
  Loader2,
  MessageSquare,
  User,
  Building2,
  Briefcase,
  Clock,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: number | null;
  otherUserName: string;
  jobId?: number;
  jobTitle?: string;
  initialMessage?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  jobId,
  jobTitle,
  initialMessage,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Profile modal state
  const [targetRole, setTargetRole] = useState<'employer' | 'worker' | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (isInitial = false) => {
    if (!otherUserId) return;
    if (isInitial) setLoading(true);
    try {
      const data = await messageService.getChatHistory(otherUserId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    }
  };

  useEffect(() => {
    if (isOpen && otherUserId) {
      setInputText(initialMessage || '');
      setError('');
      fetchMessages(true);

      // Identify if target is employer or worker
      messageService.getUserInfo(otherUserId)
        .then((info) => {
          setTargetRole(info.role as any);
        })
        .catch(() => {});

      // Auto-poll for new messages every 3 seconds
      const timer = setInterval(() => {
        fetchMessages(false);
      }, 3000);

      return () => clearInterval(timer);
    } else {
      setMessages([]);
      setTargetRole(null);
    }
  }, [isOpen, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  if (!isOpen || !otherUserId) return null;

  const handleOpenProfile = async () => {
    try {
      let role = targetRole;
      if (!role) {
        const info = await messageService.getUserInfo(otherUserId);
        role = info.role as any;
        setTargetRole(role);
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    setError('');
    const content = inputText.trim();
    setInputText('');

    try {
      const newMsg = await messageService.sendMessage({
        receiver_id: otherUserId,
        content,
        job_id: jobId
      });
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-backdrop">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-popup">
          
          {/* Chat Header */}
          <div className="p-4 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            {/* Clickable Header Name to Open Profile */}
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-3 text-left group cursor-pointer hover:opacity-90 transition"
              title="Click to view full profile"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold group-hover:border-indigo-400 transition shrink-0">
                {targetRole === 'employer' ? (
                  <Building2 className="w-5 h-5" />
                ) : otherUserName ? (
                  otherUserName[0].toUpperCase()
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 group-hover:underline transition">
                  {otherUserName || 'Messaging'}
                </h3>
                {jobTitle ? (
                  <p className="text-xs text-indigo-400 font-medium flex items-center gap-1 mt-0.5 truncate max-w-[260px]">
                    <Briefcase className="w-3 h-3" /> Re: {jobTitle}
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Direct Chat
                  </p>
                )}
              </div>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-950/40">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
                <p className="text-xs">Loading conversation history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white">Start the conversation</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Send a direct inquiry about qualifications, job details, interviews, or availability.
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
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
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
                          className={`w-3 h-3 ${m.is_read ? 'text-indigo-400' : 'text-slate-500'}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 shrink-0">
            {error && (
              <div className="mb-2 text-xs text-rose-400 px-1">
                {error}
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Company Profile Modal if other user is Employer */}
      {showCompanyModal && otherUserId && (
        <CompanyProfileModal
          isOpen={true}
          onClose={() => setShowCompanyModal(false)}
          employerId={otherUserId}
        />
      )}

      {/* Worker Profile Modal if other user is Worker */}
      {showWorkerModal && otherUserId && (
        <WorkerProfileModal
          isOpen={true}
          onClose={() => setShowWorkerModal(false)}
          workerUserId={otherUserId}
        />
      )}
    </>
  );
};
