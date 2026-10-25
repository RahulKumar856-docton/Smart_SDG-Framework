import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Clock, MapPin, AlertCircle, CheckCircle, 
  Sparkles, RefreshCw, Volume2, VolumeX, Mic, MicOff, Edit2, 
  Check, Copy, PhoneCall, ExternalLink, ShieldAlert, Award
} from 'lucide-react';
import { apiClient } from '../services/adminApi';
import { Link } from 'react-router-dom';

interface AnalysisData {
  intent?: string;
  predicted_category?: string;
  category_confidence?: number;
  predicted_priority?: string;
  priority_confidence?: number;
  extracted_location?: string;
  extracted_duration?: string;
  recommended_department_id?: number;
  recommended_department_name?: string;
  predicted_resolution_hours?: number;
  timeline_confidence?: number;
  sdg_goal?: number;
  sdg_title?: string;
  needs_clarification?: boolean;
  prediction_id?: number;
}

interface TrackingReport {
  id: number;
  report_id_code: string;
  category: string;
  title: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  analysis?: AnalysisData;
  isConfirmation?: boolean;
  isEmergency?: boolean;
  trackingReports?: TrackingReport[];
  suggestedReplies?: string[];
  originalText?: string;
  ticketRegistered?: {
    report_id_code: string;
    report_id: number;
    category: string;
    location: string;
    resolution_hours: number;
  };
}

export default function AICitizenAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "Hello! 👋 I am your **AI Municipal Assistant** for the Smart SDG Framework.\n\nI can help you in real time with:\n• 🚨 **Reporting civic issues** (water leaks, sanitation, roads, streetlights, drainage)\n• 🔍 **Tracking existing complaints & resolution SLAs**\n• 🏢 **Municipal office hours & helpline contacts**\n• 🌿 **City SDG sustainability initiatives**\n\nHow can I help you today?",
      suggestedReplies: [
        "🚨 Report an Issue",
        "🔍 Track My Reports",
        "🕒 Office Timings & Contacts",
        "🌿 City SDG Goals"
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Inline edit state for confirmation card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    category: string;
    location: string;
    priority: string;
  }>({ category: '', location: '', priority: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Audio synthesize chime
  const playChime = (type: 'send' | 'receive' | 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(460, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.09);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Speech Recognition setup
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);
    playChime('send');

    try {
      // Build conversation history payload
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text
      }));

      // Call new real-time /chat conversational endpoint
      const response = await apiClient.post('/chatbot/chat', { 
        message: textToSend,
        history: historyPayload,
        context: context
      });

      const data = response.data;
      if (data.context) {
        setContext(data.context);
      }

      playChime('receive');

      const isConfirmation = (data.intent === 'ISSUE_REPORT_CONFIRMATION' || data.is_emergency) && !!data.analysis;

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || "I've processed your message.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        analysis: data.analysis,
        isConfirmation: isConfirmation,
        isEmergency: data.is_emergency,
        trackingReports: data.tracking_reports && data.tracking_reports.length > 0 ? data.tracking_reports : undefined,
        suggestedReplies: data.suggested_replies || [],
        originalText: textToSend
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      // Fallback message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'I apologize, but I encountered a momentary connection issue. Please try again or reach the municipal helpdesk directly at **1800-123-4567**.',
        suggestedReplies: ["🚨 Report an Issue", "🕒 Office Timings"]
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (msgId: string, analysis: AnalysisData) => {
    setEditingCardId(msgId);
    setEditFormData({
      category: analysis.predicted_category || 'Water Supply',
      location: analysis.extracted_location && analysis.extracted_location !== 'Unknown' ? analysis.extracted_location : 'Ward 1',
      priority: analysis.predicted_priority || 'MEDIUM'
    });
  };

  const handleConfirm = async (msg: Message) => {
    setLoading(true);
    const analysis = msg.analysis || {};
    
    // Check if edited
    const isCustomEdited = editingCardId === msg.id;
    const categoryToSubmit = isCustomEdited ? editFormData.category : (analysis.predicted_category || 'Other Municipal Services');
    const locationToSubmit = isCustomEdited ? editFormData.location : (analysis.extracted_location || 'Unspecified');
    const priorityToSubmit = isCustomEdited ? editFormData.priority : (analysis.predicted_priority || 'MEDIUM');

    try {
      const response = await apiClient.post('/chatbot/confirm', { 
        analysis: analysis,
        original_text: msg.originalText || msg.text,
        category: categoryToSubmit,
        location: locationToSubmit,
        priority: priorityToSubmit,
        department_id: analysis.recommended_department_id
      });
      
      playChime('success');
      setEditingCardId(null);

      const trackingCode = response.data.report_id_code;
      const resHours = response.data.resolution_hours || analysis.predicted_resolution_hours || 72;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🎉 **Official Ticket Registered Successfully!**\n\nYour civic report has been dispatched to the **${analysis.recommended_department_name || 'Assigned Municipal Department'}**.\n\n• **Tracking Code**: \`${trackingCode}\`\n• **Category**: ${categoryToSubmit}\n• **Target SLA**: ${resHours} Hours\n• **Status**: Active (Submitted)`,
        ticketRegistered: {
          report_id_code: trackingCode,
          report_id: response.data.report_id,
          category: categoryToSubmit,
          location: locationToSubmit,
          resolution_hours: resHours
        },
        suggestedReplies: [
          `🔍 Track ${trackingCode}`,
          "🚨 Report Another Issue",
          "📋 View My Reports"
        ]
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: '❌ There was an error logging your request into the municipal registry. Please check your network and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "Conversation refreshed. 👋 How can I assist you with municipal services today?",
        suggestedReplies: [
          "🚨 Report an Issue",
          "🔍 Track My Reports",
          "🕒 Office Timings & Contacts",
          "🌿 City SDG Goals"
        ]
      }
    ]);
    setContext({});
    setEditingCardId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render markdown-like text smoothly
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          // Bullet point
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            const content = line.trim().substring(1).trim();
            return (
              <div key={idx} className="flex items-start pl-1 text-[13px] leading-relaxed">
                <span className="text-indigo-500 mr-2 font-bold">•</span>
                <span>{renderInlineStyles(content)}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-[13px] leading-relaxed">
              {renderInlineStyles(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Inline bold and code rendering
  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 bg-slate-100 border border-slate-200 text-indigo-700 rounded font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Get active suggested replies from the latest message
  const latestBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
  const activeSuggestedReplies = latestBotMessage?.suggestedReplies || [];

  return (
    <div className="flex flex-col h-[620px] bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden transition-all">
      
      {/* Sleek Real-time Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-3.5 text-white flex items-center justify-between shadow-md select-none">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {/* Live Green Pulsing Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-indigo-700"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm tracking-wide">AI Municipal Assistant</h3>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full flex items-center">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> LIVE NLP
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/90 font-medium">Smart SDG Civic Decision Support</p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute chimes" : "Enable chimes"}
            className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/50" />}
          </button>
          
          <button 
            onClick={handleClearChat}
            title="Restart conversation"
            className="p-1.5 hover:bg-white/15 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm mt-0.5 ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white ml-2' 
                  : 'bg-white border border-slate-200 text-indigo-600 mr-2'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              {/* Message Bubble Container */}
              <div className="space-y-2">
                <div className={`p-3.5 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-sm' 
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-sm'
                }`}>
                  {renderFormattedText(msg.text)}

                  {/* EMERGENCY WARNING BANNER */}
                  {msg.isEmergency && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-2 text-xs">
                      <div className="flex items-center font-bold text-red-700">
                        <ShieldAlert className="w-4 h-4 mr-1.5 text-red-600 animate-pulse" />
                        CRITICAL SAFETY HAZARD
                      </div>
                      <p className="text-[11px] text-red-800 leading-relaxed">
                        For immediate life-safety emergencies, call the disaster hotline immediately:
                      </p>
                      <div className="flex gap-2 pt-1">
                        <a 
                          href="tel:112"
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center shadow-sm text-[11px]"
                        >
                          <PhoneCall className="w-3 h-3 mr-1" /> Call 112
                        </a>
                        <a 
                          href="tel:1916"
                          className="px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold rounded-lg flex items-center text-[11px]"
                        >
                          <PhoneCall className="w-3 h-3 mr-1" /> Call 1916 (Water/Safety)
                        </a>
                      </div>
                    </div>
                  )}

                  {/* LIVE TRACKING CARDS */}
                  {msg.trackingReports && msg.trackingReports.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.trackingReports.map((report) => (
                        <div key={report.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 hover:bg-white transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-indigo-700">{report.report_id_code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                              report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 text-[11px] truncate">{report.title}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>📍 {report.location || 'Ward Unspecified'}</span>
                            <Link 
                              to={`/citizen/reports/${report.id}`}
                              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                            >
                              Details <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* OFFICIAL TICKET CONFIRMATION CARD */}
                  {msg.isConfirmation && msg.analysis && !msg.ticketRegistered && (
                    <div className="mt-3.5 p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl text-xs space-y-3 shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <Award className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-900">
                            {editingCardId === msg.id ? 'Edit Report Preview' : 'Official Report Preview'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            (editingCardId === msg.id ? editFormData.priority : msg.analysis.predicted_priority) === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                            (editingCardId === msg.id ? editFormData.priority : msg.analysis.predicted_priority) === 'HIGH' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {editingCardId === msg.id ? editFormData.priority : msg.analysis.predicted_priority}
                          </span>

                          {editingCardId !== msg.id && (
                            <button
                              onClick={() => handleStartEdit(msg.id, msg.analysis!)}
                              className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-slate-200/60 transition-colors"
                              title="Edit details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Regular View */}
                      {editingCardId !== msg.id ? (
                        <>
                          <div className="grid grid-cols-2 gap-2.5 py-1">
                            <div className="flex items-start text-slate-700">
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 block font-medium">Category</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {msg.analysis.predicted_category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start text-slate-700">
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 block font-medium">Location</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {msg.analysis.extracted_location}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start text-slate-700">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                                <span className="font-semibold text-slate-800 truncate block">
                                  {msg.analysis.extracted_duration}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start text-slate-700">
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] text-slate-400 block font-medium">Resolution Target</span>
                                <span className="font-semibold text-emerald-700 block">
                                  {msg.analysis.predicted_resolution_hours}h SLA
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Department & SDG info */}
                          <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between text-[11px] text-indigo-900">
                            <span className="truncate">
                              🏢 <strong>{msg.analysis.recommended_department_name || 'Public Works'}</strong>
                            </span>
                            {msg.analysis.sdg_title && (
                              <span className="text-[10px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shrink-0 ml-1">
                                {msg.analysis.sdg_title.split(':')[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button 
                              onClick={() => handleConfirm(msg)}
                              disabled={loading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center shadow-xs text-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" /> Confirm & Submit Request
                            </button>
                            <button
                              onClick={() => handleStartEdit(msg.id, msg.analysis!)}
                              className="px-2.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Inline Edit Form */
                        <div className="space-y-2.5 pt-1">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                            <select 
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white mt-0.5 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Water Supply">Water Supply</option>
                              <option value="Sanitation">Sanitation</option>
                              <option value="Waste Management">Waste Management</option>
                              <option value="Roads">Roads & Pavements</option>
                              <option value="Drainage">Drainage & Sewage</option>
                              <option value="Streetlights">Streetlights</option>
                              <option value="Parks">Parks & Green Spaces</option>
                              <option value="Flooding">Flooding & Waterlogging</option>
                              <option value="Other Municipal Services">Other Municipal Services</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Location / Ward</label>
                            <input 
                              type="text"
                              value={editFormData.location}
                              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                              placeholder="e.g. Ward 4 near Clock Tower"
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white mt-0.5 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Priority Urgency</label>
                            <select 
                              value={editFormData.priority}
                              onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                              className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white mt-0.5 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="CRITICAL">CRITICAL (Emergency)</option>
                              <option value="HIGH">HIGH (Urgent)</option>
                              <option value="MEDIUM">MEDIUM (Standard)</option>
                              <option value="LOW">LOW</option>
                            </select>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => handleConfirm(msg)}
                              disabled={loading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors"
                            >
                              Save & Submit
                            </button>
                            <button 
                              onClick={() => setEditingCardId(null)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TICKET REGISTERED CARD */}
                  {msg.ticketRegistered && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900">Registered Ticket ID</span>
                        <button 
                          onClick={() => copyToClipboard(msg.ticketRegistered!.report_id_code, msg.id)}
                          className="flex items-center text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copiedId === msg.id ? 'Copied' : 'Copy ID'}
                        </button>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-emerald-200/80 font-mono text-sm font-bold text-center text-emerald-800 tracking-wider">
                        {msg.ticketRegistered.report_id_code}
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px] text-emerald-800">
                        <span>Expected SLA: <strong>{msg.ticketRegistered.resolution_hours}h</strong></span>
                        <Link 
                          to={`/citizen/reports/${msg.ticketRegistered.report_id}`}
                          className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center"
                        >
                          View Official Details <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className={`text-[10px] text-slate-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Real-time typing bubble */}
        {loading && (
          <div className="flex justify-start items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center text-xs shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
              <span className="text-xs text-slate-500 font-medium mr-1">Analyzing</span>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      {activeSuggestedReplies.length > 0 && !loading && (
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/70 overflow-x-auto flex gap-1.5 no-scrollbar">
          {activeSuggestedReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleSend(reply)}
              className="text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-all shadow-2xs hover:shadow-xs shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200/80">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Listening... speak now..." : "Ask a question or describe an issue (e.g. 'Water leak in Ward 4')..."}
            className={`w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border ${
              isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            } rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all`}
            disabled={loading}
          />
          
          <div className="absolute right-1.5 flex items-center space-x-1">
            {/* Speech to Text Mic Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? "Stop listening" : "Speak to assistant"}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Send Button */}
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-xs"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

