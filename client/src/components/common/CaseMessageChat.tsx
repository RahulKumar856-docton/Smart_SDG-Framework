import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Paperclip, AlertCircle, Clock, User, Shield } from 'lucide-react';
import { apiClient } from '../../services/citizenApi';

interface CaseMessageChatProps {
  entityType: 'SERVICE_REQUEST' | 'REPORT';
  entityId: number | string;
  caseTitle?: string;
  isClosed?: boolean;
}

interface MessageItem {
  id: number;
  entity_type: string;
  entity_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  is_self: boolean;
}

export default function CaseMessageChat({
  entityType,
  entityId,
  caseTitle,
  isClosed = false
}: CaseMessageChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get(`/messages/${entityType}/${entityId}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err: any) {
      if (!silent) setError('Unable to load communication history.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    pollTimerRef.current = setInterval(() => {
      fetchMessages(true);
    }, 6000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [entityType, entityId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await apiClient.post(`/messages/${entityType}/${entityId}`, {
        message: text
      });

      if (res.data?.success) {
        setInputText('');
        if (res.data.data) {
          setMessages(prev => [...prev, res.data.data]);
        } else {
          fetchMessages(true);
        }
      } else {
        setError(res.data?.message || 'Failed to send message.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-sm">Direct Citizen Communication</h3>
            <p className="text-[11px] text-slate-300">Official two-way case messaging</p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
          {messages.length} messages
        </span>
      </div>

      {/* Closed Notice */}
      {isClosed && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Case closed. Direct messaging is read-only.</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <p className="text-xs">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
            <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No messages yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Send a message below to reach the citizen directly.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isSelf = msg.is_self;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1 text-[11px]">
                  <span className="font-bold text-slate-700">
                    {isSelf ? 'You' : msg.sender_name}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                    {msg.sender_role}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                    isSelf 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  {msg.attachment_url && (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                      <a 
                        href={`http://localhost:5000${msg.attachment_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 underline font-semibold flex items-center space-x-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>View Attachment</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {!isClosed && (
        <div className="p-3 bg-white border-t border-slate-200">
          {error && (
            <p className="text-[11px] text-red-600 mb-2 px-1">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type message to citizen..."
              maxLength={2000}
              disabled={sending}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
