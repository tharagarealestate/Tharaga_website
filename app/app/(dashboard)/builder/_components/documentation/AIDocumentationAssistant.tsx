'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, BookOpen, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Citation {
  feature_key: string;
  feature_name: string;
  similarity?: number;
}

interface AIDocumentationAssistantProps {
  contextFeatureKey?: string;
  contextPageUrl?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AIDocumentationAssistant({
  contextFeatureKey,
  contextPageUrl,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: AIDocumentationAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `doc-assistant-${Date.now()}-${Math.random()}`);
  const [citations, setCitations] = useState<Citation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = externalIsOpen !== undefined;
  const actualIsOpen = isControlled ? externalIsOpen : isOpen;
  const handleClose = isControlled ? externalOnClose : () => setIsOpen(false);
  const handleToggle = () => {
    if (isControlled) {
      externalOnClose?.();
    } else {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (actualIsOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [actualIsOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setCitations([]);

    try {
      const response = await fetch('/api/documentation/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          contextFeatureKey: contextFeatureKey || null,
          contextPageUrl: contextPageUrl || window.location.pathname,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.citations && data.citations.length > 0) {
        setCitations(data.citations);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating button (when not controlled)
  if (!isControlled && !actualIsOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-full shadow-lg glow-border flex items-center justify-center z-50 transition-all hover:shadow-amber-500/30"
        aria-label="Open AI Documentation Assistant"
      >
        <Bot className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {actualIsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-800/95 backdrop-blur-xl rounded-xl glow-border w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Documentation Assistant</h3>
                  <p className="text-xs text-slate-400">Ask me anything about Tharaga features</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      How can I help you today?
                    </h4>
                    <p className="text-sm text-slate-400 mb-4">
                      Ask me anything about Tharaga features, or try:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        'How do I score leads?',
                        'What is behavioral lead scoring?',
                        'How to set up WhatsApp automation?',
                        'Explain AI virtual staging',
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(suggestion);
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="px-3 py-1.5 text-sm bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-300" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
                            : 'bg-slate-700/50 text-slate-200'
                        }`}
                      >
                        <div className="prose prose-invert prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-amber-300" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-300" />
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-2">Referenced Features:</p>
                <div className="flex flex-wrap gap-2">
                  {citations.map((citation, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Open feature documentation modal
                        console.log('Open feature:', citation.feature_key);
                      }}
                      className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      {citation.feature_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any Tharaga feature..."
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Powered by AI • Your questions help us improve
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


