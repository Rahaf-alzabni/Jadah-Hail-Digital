import { useCallback, useEffect, useRef, useState } from 'react';
import { Zap, User, Send, Loader2 } from 'lucide-react';
import { askAssistant, getAssistantConfig, type AssistantOption } from '@/api/assistant';

type ChatMessage = {
  role: 'assistant' | 'user';
  ar: string;
  en: string;
};

export function AIAssistantSection({ lang }: { lang: string }) {
  const ar = lang === 'ar';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [options, setOptions] = useState<AssistantOption[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAssistantConfig()
      .then((config) => {
        setOptions(config.options);
        if (config.welcome_ar || config.welcome_en) {
          setMessages([{
            role: 'assistant',
            ar: config.welcome_ar,
            en: config.welcome_en,
          }]);
        }
      })
      .catch(() => {
        setMessages([{
          role: 'assistant',
          ar: 'مرحباً! اختر أحد الخيارات أدناه للحصول على إجابة فورية.',
          en: 'Hello! Choose an option below for an instant answer.',
        }]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const submit = useCallback(async (payload: { option_id?: number; message?: string; promptAr?: string; promptEn?: string }) => {
    if (sending) return;
    setSending(true);

    const userText = payload.promptAr && payload.promptEn
      ? { ar: payload.promptAr, en: payload.promptEn }
      : { ar: payload.message ?? '', en: payload.message ?? '' };

    if (userText.ar || userText.en) {
      setMessages((m) => [...m, { role: 'user', ...userText }]);
    }

    try {
      const answer = await askAssistant({
        option_id: payload.option_id,
        message: payload.message,
      });
      setMessages((m) => [...m, {
        role: 'assistant',
        ar: answer.response_ar,
        en: answer.response_en,
      }]);
    } catch {
      setMessages((m) => [...m, {
        role: 'assistant',
        ar: 'تعذّر جلب الإجابة. حاول مرة أخرى أو اختر أحد الخيارات.',
        en: 'Could not fetch an answer. Try again or pick an option.',
      }]);
    } finally {
      setSending(false);
      setInput('');
    }
  }, [sending]);

  const pickOption = (option: AssistantOption) => {
    submit({
      option_id: option.id,
      promptAr: option.prompt_ar,
      promptEn: option.prompt_en,
    });
  };

  const sendTyped = () => {
    const text = input.trim();
    if (!text) return;
    submit({ message: text });
  };

  return (
    <section className="py-16 px-6 bg-[#0E1C36]" dir={ar ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C4912A] mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <p className="text-xs font-semibold text-[#C4912A] uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono'" }}>
            {ar ? 'مساعد سياحي' : 'Tourism Guide'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Playfair Display'" }}>
            {ar ? 'مساعدك السياحي الذكي' : 'Your Smart Tourism Assistant'}
          </h2>
          <p className="text-white/50 mt-2 text-sm" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
            {ar ? 'اختر سؤالاً جاهزاً — إجابة فورية وواضحة' : 'Pick a ready question — instant clear answers'}
          </p>
        </div>

        <div className="bg-[#162235] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div ref={scrollRef} className="h-80 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-white/50 py-12">
                <Loader2 size={18} className="animate-spin text-[#C4912A]" />
                <span className="text-sm" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                  {ar ? 'جاري التحميل...' : 'Loading...'}
                </span>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#C4912A] flex items-center justify-center shrink-0 mt-0.5">
                      <Zap size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[#C4912A] text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}>
                      {ar ? m.ar : m.en}
                    </p>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#C4912A] flex items-center justify-center shrink-0">
                  <Loader2 size={14} className="animate-spin text-white" />
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3 text-white/50 text-sm">
                  {ar ? 'جاري الرد...' : 'Replying...'}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/8">
            <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider" style={{ fontFamily: "'DM Mono'" }}>
              {ar ? 'خيارات سريعة' : 'Quick options'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={sending || loading}
                  onClick={() => pickOption(option)}
                  className="text-xs bg-[#C4912A]/20 hover:bg-[#C4912A]/35 border border-[#C4912A]/40 text-[#C4912A] hover:text-white px-3 py-2 rounded-full transition-colors disabled:opacity-50"
                  style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
                >
                  {ar ? option.prompt_ar : option.prompt_en}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/8">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
                disabled={sending || loading}
                placeholder={ar ? 'أو اكتب سؤالك...' : 'Or type your question...'}
                className="flex-1 bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#C4912A]/60 transition-colors disabled:opacity-50"
                style={{ fontFamily: ar ? "'Noto Naskh Arabic'" : "'Inter'" }}
              />
              <button
                type="button"
                onClick={sendTyped}
                disabled={sending || loading || !input.trim()}
                className="bg-[#C4912A] hover:bg-[#B07F24] disabled:opacity-50 text-white px-5 rounded-xl transition-colors flex items-center gap-2"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
