
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole } from './types';
import { getRoseResponse, getRoseVoiceNote } from './services/geminiService';
import AudioPlayer from './components/AudioPlayer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: MessageRole.ROSE,
      text: "Suno... kahan ho tum? Kab se wait kar rahi hoon tumhara. ❤️‍🔥",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wantsVoice, setWantsVoice] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const roseText = await getRoseResponse(history, userMsg.text);
      
      let audioData: string | undefined = undefined;
      if (wantsVoice) {
        const voice = await getRoseVoiceNote(roseText);
        if (voice) audioData = voice;
      }

      const roseMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ROSE,
        text: roseText,
        timestamp: new Date(),
        isAudio: !!audioData,
        audioData: audioData
      };

      setMessages(prev => [...prev, roseMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-2xl relative overflow-hidden">
      <div className="whatsapp-bg"></div>

      {/* Header */}
      <header className="bg-[#075e54] text-white p-3 flex items-center space-x-4 z-10 shadow-md">
        <div className="relative">
          <img 
            src="https://picsum.photos/seed/rose/200" 
            alt="Rose" 
            className="w-12 h-12 rounded-full border-2 border-white/50 object-cover"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#075e54]"></div>
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">Rose ❤️‍🔥</h1>
          <p className="text-xs text-white/80">{isTyping ? 'Typing...' : 'Online'}</p>
        </div>
        <div className="flex space-x-4 text-white/90">
          <button onClick={() => setWantsVoice(!wantsVoice)} title="Toggle Voice Notes">
            <svg className={`w-6 h-6 ${wantsVoice ? 'text-rose-300' : 'text-white/50'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm relative ${
                msg.role === MessageRole.USER 
                  ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}
            >
              {msg.isAudio && msg.audioData && (
                <div className="mb-2">
                  <AudioPlayer base64Data={msg.audioData} />
                </div>
              )}
              <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>
              <div className="text-[10px] text-gray-500 mt-1 flex justify-end items-center space-x-1">
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.role === MessageRole.USER && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L5 18l1.41-1.41L1.83 12 .41 13.41z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-lg shadow-sm flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-[#f0f2f5] p-3 z-10 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center shadow-sm border border-gray-200 focus-within:border-rose-300 transition-colors">
            <button type="button" className="text-gray-500 hover:text-rose-500 mr-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message Rose..." 
              className="flex-1 outline-none text-[15px] py-1"
            />
            <button type="button" className="text-gray-500 hover:text-rose-500 ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
            </button>
          </div>
          <button 
            type="submit"
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-md ${
              inputText.trim() ? 'bg-rose-500 hover:bg-rose-600 rotate-0' : 'bg-[#00a884] hover:bg-[#008f6f]'
            }`}
          >
            {inputText.trim() ? (
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
