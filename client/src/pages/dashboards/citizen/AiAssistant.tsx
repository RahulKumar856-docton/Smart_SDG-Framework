import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';
import { apiClient } from '../../../services/adminApi';
import { Link } from 'react-router-dom';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! 👋 I'm your Municipal Assistant. I can help you report civic issues, submit service requests, track existing requests, and find municipal services. What would you like help with?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [context, setContext] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const userMessage = textOverride || input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      if (parsedData && ['yes', 'yeah', 'register it', 'submit', 'okay'].includes(userMessage.toLowerCase())) {
        await handleRegisterRequest();
        return;
      }

      const res = await apiClient.post('/citizen/assistant/parse', { 
        text: userMessage,
        context: context
      });
      
      if (res.data.success) {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: res.data.message 
        }]);
        
        if (res.data.intent === 'MISSING_LOCATION' || res.data.intent === 'MISSING_DURATION') {
          setContext(res.data.context);
        } else if (res.data.intent === 'SERVICE_REQUEST_CONFIRMATION') {
          setParsedData(res.data.parsed_data);
          setContext({});
        } else if (res.data.intent === 'CANCELLATION' || res.data.intent === 'GREETING' || res.data.intent === 'GENERAL_QUESTION') {
          setParsedData(null);
          setContext({});
        } else if (res.data.intent === 'REQUEST_STATUS') {
          fetchRecentRequests();
        }
      } else {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Sorry, I am having trouble understanding right now. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'The AI assistant is temporarily unavailable. You can still submit your request using the standard form in the menu.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const res = await citizenApi.getRequests();
      if (res.success && res.data.length > 0) {
        const top = res.data.slice(0, 3);
        const text = top.map((r: any) => `- ${r.request_id_code}: ${r.category} (${r.status.replace('_', ' ')})`).join('\n');
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: "Here are your recent requests:\n" + text 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: "You don't have any active requests at the moment." 
        }]);
      }
    } catch (e) {}
  };

  const handleRegisterRequest = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    try {
      const payload = {
        category: parsedData.category,
        description: parsedData.original_text,
        location: parsedData.location,
        ward: parsedData.ward,
        priority: parsedData.priority,
        department_id: parsedData.department_id,
        is_ai_assisted: true
      };
      
      const res = await apiClient.post('/citizen/assistant/create-request', payload);
      if (res.data.success) {
        setParsedData(null);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: `Success! Your request has been registered with ID: ${res.data.request_id}. It has been assigned to the ${parsedData.department_name} department.` 
        }]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to register request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Municipal Assistant</h1>
        <p className="text-sm text-gray-500">Your intelligent assistant for municipal services</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                  <Bot className="w-5 h-5 text-teal-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.sender === 'user' 
                  ? 'bg-teal-600 text-white rounded-tr-sm shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 ml-3 mt-1 shadow-sm">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {parsedData && !isTyping && (
            <div className="flex items-start">
               <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                  <Bot className="w-5 h-5 text-teal-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-5 shadow-sm max-w-[85%] w-full">
                  <div className="flex items-center text-teal-700 font-semibold mb-3">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    AI Understanding Summary
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Category</span>
                      <span className="font-medium text-gray-900">{parsedData.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Location</span>
                      <span className="font-medium text-gray-900">{parsedData.ward} {parsedData.location && parsedData.location !== parsedData.ward ? `(${parsedData.location})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Duration</span>
                      <span className="font-medium text-gray-900">{parsedData.duration}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Priority</span>
                      <span className={`font-medium ${parsedData.priority === 'High' ? 'text-red-600' : 'text-orange-500'}`}>{parsedData.priority} (Predicted)</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleSend(undefined, 'yes')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Register Request
                    </button>
                    <button 
                      onClick={() => handleSend(undefined, 'cancel')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel / Edit
                    </button>
                  </div>
                </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
            <button onClick={() => handleSend(undefined, "I want to report an issue")} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 whitespace-nowrap">Report an Issue</button>
            <button onClick={() => handleSend(undefined, "Track my requests")} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 whitespace-nowrap">Track Requests</button>
            <button onClick={() => handleSend(undefined, "What municipal services are available?")} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 whitespace-nowrap">Municipal Services</button>
          </div>
          <form onSubmit={handleSend} className="flex items-end space-x-2">
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all overflow-hidden relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your issue or ask a question..."
                className="w-full max-h-32 min-h-[56px] py-3 pl-4 pr-12 bg-transparent outline-none resize-none text-sm"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-14 h-14 shrink-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
