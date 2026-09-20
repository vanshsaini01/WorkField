import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { aiService } from '../../services/aiService';
import { profileService } from '../../services/profileService';
import { WorkerProfile } from '../../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  Award, 
  Lightbulb, 
  ChevronRight 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedSkills?: string[];
  suggestedRoles?: string[];
  timestamp: string;
}

export const CareerAssistant: React.FC = () => {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInitialData = async () => {
    try {
      const p = await profileService.getWorkerProfile();
      setProfile(p);

      // Initial welcoming prompt
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        text: `Hello ${p.title || 'Field Specialist'}! 👋 I am your **WorkForce AI Career Advisor**.\n\nI have analyzed your trade profile (${p.profession || 'Technician'} with ${p.experience_years || 2} years of experience) against active market demand in our platform. Ask me anything about job suitability, high-paying skills, or salary projections!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputValue).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const advice = await aiService.askCareerAssistant(q);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: advice.reply,
        recommendedSkills: advice.recommended_skills,
        suggestedRoles: advice.suggested_roles,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue analyzing career trends. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const promptSuggestions = [
    "What jobs are suitable for me?",
    "Which skills should I learn to increase my salary?",
    "What is the average salary for my trade in Roorkee & Haridwar?",
    "How can I prepare for an industrial technician interview?"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-4">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Career Assistant</h1>
              <p className="text-xs text-slate-400">
                Tailored job matches, upskilling recommendations & wage analysis
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs text-indigo-400 font-semibold">
            <Award className="w-3.5 h-3.5" />
            Personalized to your Profile
          </div>
        </div>

        {/* Chat History Box */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-y-auto min-h-[450px] max-h-[550px] space-y-4 shadow-xl">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line text-xs sm:text-sm">
                  {m.text}
                </div>

                {/* Optional Recommended Skills Tags */}
                {m.recommendedSkills && m.recommendedSkills.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1.5">
                      Top In-Demand Skills to Learn:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.recommendedSkills.map((sk, idx) => (
                        <span key={idx} className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-md font-medium">
                          ★ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <span className={`block text-[10px] text-right mt-1 ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                AI is analyzing active market vacancies...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap gap-2">
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(prompt)}
              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex items-center gap-2 shadow-xl"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your AI Career Advisor (e.g. 'Which skills should I learn?')..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-1.5 font-semibold text-xs cursor-pointer shadow-md shadow-indigo-600/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </form>

      </main>
    </div>
  );
};

