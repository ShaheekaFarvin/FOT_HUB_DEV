import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/api';

const renderFormattedMessage = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/\\([*_])/g, '$1');
  const lines = cleaned.split('\n');

  return (
    <div className="space-y-1" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {lines.map((line, idx) => {
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const rawContent = isBullet ? line.trim().replace(/^[-*]\s+/, '') : line;
        
        const parts = rawContent.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
              <span className="font-bold select-none" style={{ color: 'var(--text-accent, #3b82f6)' }}>•</span>
              <span>{parts}</span>
            </div>
          );
        }

        return <div key={idx}>{parts}</div>;
      })}
    </div>
  );
};

const FotBuddy = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm FOT Buddy 👋 Ask me anything about the faculty." },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await sendChatMessage(text);
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't respond right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open FOT Buddy chat"
        className="fixed bottom-5 right-5 z-40 w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #0d1b2a, #1e40af)',
          boxShadow: open
            ? '0 8px 24px rgba(30,64,175,0.45)'
            : '0 8px 24px rgba(30,64,175,0.5), 0 0 0 6px rgba(30,64,175,0.15)',
          border: '2px solid #fff',
        }}>
        {open
          ? <X size={24} color="#fff" strokeWidth={2.5} />
          : <MessageCircle size={26} color="#fff" strokeWidth={2.5} />}

        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(30,64,175,0.35)', animationDuration: '2.5s' }}
          />
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-40 w-80 sm:w-96 rounded-2xl flex flex-col animate-fade-up"
          style={{ height: '480px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

          <div className="flex items-center gap-2 px-4 py-3 rounded-t-2xl"
            style={{ background: 'linear-gradient(135deg, #0d1b2a, #1e40af)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#fff' }}>
              <MessageCircle size={16} color="#1e40af" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#fff' }}>FOT Buddy</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.75)' }}>Ask me anything</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                  style={
                    m.role === 'user'
                      ? { background: '#1e40af', color: '#fff', borderBottomRightRadius: '4px' }
                      : { background: 'var(--bg-muted)', color: 'var(--text-primary)', borderBottomLeftRadius: '4px' }
                  }>
                  {renderFormattedMessage(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl flex items-center gap-1" style={{ background: 'var(--bg-muted)' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Typing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 p-3 border-t" style={{ borderColor: 'var(--border-card)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-card)' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
              style={{ background: '#1e40af' }}>
              <Send size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FotBuddy;