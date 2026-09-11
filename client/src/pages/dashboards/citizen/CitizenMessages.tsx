import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Paperclip, Search, AlertCircle, 
  FileText, Shield, User, Clock, ArrowLeft, Check, CheckCheck,
  RefreshCw, X, ExternalLink, Filter, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

interface Conversation {
  id: string;
  entity_type: 'SERVICE_REQUEST' | 'REPORT';
  entity_id: number;
  reference_id: string;
  title: string;
  category: string;
  status: string;
  severity?: string;
  department_name: string;
  officer_name?: string;
  is_closed: boolean;
  last_message: string;
  last_message_sender?: string;
  last_message_role?: string;
  last_message_at: string;
  unread_count: number;
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

export default function CitizenMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD' | 'SERVICE_REQUEST' | 'REPORT'>('ALL');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Load conversations list
  const loadConversations = async (silent = false) => {
    if (!silent) setError(null);
    try {
      const res = await citizenApi.getConversations();
      if (res.success) {
        const data = res.data || [];
        setConversations(data);
        
        // If a query parameter `conv` is provided, select that conversation
        const convParam = searchParams.get('conv');
        if (convParam && !selectedConv) {
          const match = data.find((c: Conversation) => c.id === convParam || `${c.entity_type}-${c.entity_id}` === convParam);
          if (match) {
            setSelectedConv(match);
          }
        }
      } else {
        if (!silent) setError(res.message || 'Unable to load messages.');
      }
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
      if (!silent) setError('Unable to connect to the municipal communication service.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load messages for the selected conversation
  const loadMessages = async (conv: Conversation, silent = false) => {
    if (!silent) {
      setMessagesLoading(true);
      setSendError(null);
    }
    try {
      const res = await citizenApi.getConversationMessages(conv.entity_type, conv.entity_id);
      if (res.success) {
        setMessages(res.data || []);
        setCaseInfo(res.case_info || null);
        
        // Clear unread count locally for this conversation
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
      } else {
        if (!silent) setSendError(res.message || 'Unable to load messages.');
      }
    } catch (err: any) {
      console.error("Failed to load messages:", err);
      if (!silent) setSendError('Failed to load message history.');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // When selectedConv changes, fetch its messages and update URL
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      setSearchParams({ conv: selectedConv.id });
    }
  }, [selectedConv?.id]);

  // Polling for live updates every 6 seconds
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      loadConversations(true);
      if (selectedConv) {
        loadMessages(selectedConv, true);
      }
    }, 6000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedConv?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConv) return;
    
    const text = inputText.trim();
    if (!text && !attachedFile) return;
    if (text.length > 2000) {
      setSendError('Message exceeds 2000 characters limit.');
      return;
    }

    setSending(true);
    setSendError(null);

    let attachmentUrl: string | undefined = undefined;

    try {
      // 1. Upload attachment if present
      if (attachedFile) {
        setUploadingAttachment(true);
        const uploadRes = await citizenApi.uploadMessageAttachment(attachedFile);
        if (uploadRes.success) {
          attachmentUrl = uploadRes.attachment_url;
        } else {
          throw new Error(uploadRes.message || 'Attachment upload failed.');
        }
      }

      // 2. Post the message
      const res = await citizenApi.sendMessage(
        selectedConv.entity_type, 
        selectedConv.entity_id, 
        text, 
        attachmentUrl
      );

      if (res.success) {
        setInputText('');
        setAttachedFile(null);
        if (res.data) {
          setMessages(prev => [...prev, res.data]);
        } else {
          loadMessages(selectedConv, true);
        }
        loadConversations(true);
      } else {
        setSendError(res.message || 'Unable to send message.');
      }
    } catch (err: any) {
      console.error("Message send error:", err);
      setSendError(err.message || 'Unable to send message. Please check connection and retry.');
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    // Search query filter
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || 
      c.title.toLowerCase().includes(q) || 
      c.reference_id.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q) || 
      (c.last_message && c.last_message.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    // Type filter
    if (filterType === 'UNREAD') return c.unread_count > 0;
    if (filterType === 'SERVICE_REQUEST') return c.entity_type === 'SERVICE_REQUEST';
    if (filterType === 'REPORT') return c.entity_type === 'REPORT';
    return true;
  });

  // Helpers for date formatting & grouping
  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (d.toDateString() === now.toDateString()) return 'TODAY';
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  // Group messages by date
  const groupedMessages: { dateHeader: string; msgs: MessageItem[] }[] = [];
  messages.forEach(msg => {
    const header = getMessageDateHeader(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.dateHeader === header) {
      lastGroup.msgs.push(msg);
    } else {
      groupedMessages.push({ dateHeader: header, msgs: [msg] });
    }
  });

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[720px] flex overflow-hidden">
          <div className="w-full lg:w-96 border-r border-slate-200 p-4 space-y-3">
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3 border border-slate-100 rounded-xl space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
            <div className="text-center space-y-2">
              <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-500 font-medium text-sm">Loading conversations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load messages</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button 
            onClick={() => loadConversations()} 
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center mx-auto space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State (Zero conversations across all requests & reports)
  if (conversations.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MESSAGES</h1>
          <p className="text-slate-500 text-sm">Communicate with municipal staff regarding your services and reports.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No conversations yet</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Conversations will appear here when municipal staff begin handling your Service Requests or Reports.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link 
              to="/citizen/request-service"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Request a Service</span>
            </Link>
            <Link 
              to="/citizen/report"
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition shadow-sm flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Report an Issue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">MESSAGES</h1>
        <p className="text-slate-500 text-sm mt-1">Communicate with municipal staff regarding your services and reports.</p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[750px] flex flex-col lg:flex-row overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: CONVERSATION LIST (Hidden on mobile if conversation selected) */}
        {/* ========================================================================= */}
        <div className={`w-full lg:w-96 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterType('UNREAD')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  filterType === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilterType('SERVICE_REQUEST')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  filterType === 'SERVICE_REQUEST' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setFilterType('REPORT')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  filterType === 'REPORT' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Reports
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No conversations match your search.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const isService = conv.entity_type === 'SERVICE_REQUEST';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 transition-all flex flex-col space-y-1.5 relative ${
                      isSelected 
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600' 
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isService 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isService ? 'Service Request' : 'Report'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatTimestamp(conv.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-slate-900 truncate pr-2">
                        {conv.title}
                      </h3>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                          {conv.unread_count} unread
                        </span>
                      )}
                    </div>

                    <div className="flex items-center text-xs text-slate-500 space-x-1.5 font-mono">
                      <span>{conv.reference_id}</span>
                      <span>&bull;</span>
                      <span className="font-sans truncate">{conv.department_name}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 italic">
                      {conv.last_message_sender ? `${conv.last_message_sender}: ` : ''}
                      "{conv.last_message}"
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: SELECTED CONVERSATION VIEW                                   */}
        {/* ========================================================================= */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col h-full bg-slate-50/30 overflow-hidden">
            
            {/* Conversation Header */}
            <div className="p-4 md:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm z-10">
              <div className="flex items-center space-x-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedConv(null)}
                  className="p-2 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedConv.entity_type === 'SERVICE_REQUEST' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedConv.entity_type === 'SERVICE_REQUEST' ? 'Service Request' : 'Report'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {selectedConv.reference_id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 uppercase">
                      {selectedConv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 mt-1 truncate max-w-md md:max-w-lg">
                    {selectedConv.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedConv.department_name} 
                    {selectedConv.officer_name ? ` • Assigned: ${selectedConv.officer_name}` : ' • Assigned to Municipal Staff'}
                  </p>
                </div>
              </div>

              {/* View Case Details Button */}
              <Link
                to={selectedConv.entity_type === 'SERVICE_REQUEST' 
                  ? `/citizen/services/${selectedConv.entity_id}` 
                  : `/citizen/reports/${selectedConv.entity_id}`
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shrink-0"
              >
                <span>View {selectedConv.entity_type === 'SERVICE_REQUEST' ? 'Service Request' : 'Report'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Closed Case Banner */}
            {selectedConv.is_closed && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Conversation Closed:</strong> This municipal case has been closed and cannot receive new messages.</span>
              </div>
            )}

            {/* Message History Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-xs">Loading message history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8">
                  <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-semibold text-slate-700 text-sm">No messages exchanged yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Send a message below to communicate directly with the assigned municipal department.
                  </p>
                </div>
              ) : (
                groupedMessages.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    {/* Date Divider */}
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {group.dateHeader}
                      </span>
                    </div>

                    {/* Messages in this group */}
                    {group.msgs.map(msg => {
                      const isSelf = msg.is_self;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center space-x-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-slate-700">
                              {isSelf ? 'You (Citizen)' : msg.sender_name}
                            </span>
                            {!isSelf && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                {msg.sender_role}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>

                          <div
                            className={`max-w-lg md:max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm space-y-2 leading-relaxed ${
                              isSelf 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            
                            {/* Attachment Preview if any */}
                            {msg.attachment_url && (
                              <div className="pt-2 border-t border-white/20">
                                <a 
                                  href={`http://localhost:5000${msg.attachment_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center space-x-1.5 text-xs font-semibold underline ${
                                    isSelf ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span>View Attachment</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            {!selectedConv.is_closed ? (
              <div className="p-4 bg-white border-t border-slate-200">
                {/* Send Error Notice */}
                {sendError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
                    <span>{sendError}</span>
                    <button 
                      onClick={() => handleSendMessage()} 
                      className="font-bold underline ml-2 hover:text-red-900"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* File Attachment Pill */}
                {attachedFile && (
                  <div className="mb-2 inline-flex items-center space-x-2 bg-slate-100 border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-700">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-xs">{attachedFile.name}</span>
                    <button 
                      onClick={() => setAttachedFile(null)} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachedFile(e.target.files[0]);
                      }
                    }}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="hidden"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    title="Attach File (PNG, JPG, PDF)"
                    className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Text Input Area */}
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message... (Enter to send)"
                      maxLength={2000}
                      disabled={sending}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition"
                    />
                    <span className="absolute right-2.5 bottom-2 text-[10px] text-slate-400 font-mono">
                      {inputText.length}/2000
                    </span>
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sending || (!inputText.trim() && !attachedFile)}
                    className={`px-5 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-1.5 transition shadow-sm shrink-0 ${
                      sending || (!inputText.trim() && !attachedFile)
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    {sending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <span>Send</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Select a conversation</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Choose a Service Request or Report from the list on the left to view messages and communicate with municipal staff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
