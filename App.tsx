
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, Smartphone, Settings, 
  Plus, Search, Send, Zap, CheckCircle2, AlertCircle, QrCode, 
  LogOut, X, Edit3, Terminal, Activity, Wifi, RefreshCw, 
  Trash2, CreditCard, Copy, Building2, UserCheck, Globe
} from 'lucide-react';
import { ViewState, Agent, Conversation, AgentRole, Message, LogEntry } from './types';
import { geminiService } from './services/geminiService';

const INITIAL_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Consultor AO Express',
    role: AgentRole.SALES,
    instruction: 'Atendimento para logística em Luanda. Profissional e direto.',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    contactName: 'Cliente Exemplo',
    contactNumber: '+244 923 000 000',
    lastMessage: 'Olá, como posso pagar?',
    timestamp: new Date().toISOString(),
    unread: 1,
    messages: [
      { id: 'm1', sender: 'customer', content: 'Olá, como posso pagar?', timestamp: new Date().toISOString() }
    ],
    agentId: '1'
  }
];

const App: React.FC = () => {
  // Persistence States
  const [view, setView] = useState<ViewState>(() => (localStorage.getItem('lastView') as ViewState) || 'dashboard');
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('agents');
    return saved ? JSON.parse(saved) : INITIAL_AGENTS;
  });
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });
  const [isLinked, setIsLinked] = useState(() => localStorage.getItem('isLinked') === 'true');
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('phoneNumber') || '');
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });

  // IBAN / Settings States
  const [iban, setIban] = useState(() => localStorage.getItem('iban') || '');
  const [bankName, setBankName] = useState(() => localStorage.getItem('bankName') || 'BAI');
  const [accountHolder, setAccountHolder] = useState(() => localStorage.getItem('accountHolder') || '');

  // UI Runtime States
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync Data to LocalStorage
  useEffect(() => {
    localStorage.setItem('agents', JSON.stringify(agents));
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('logs', JSON.stringify(logs));
    localStorage.setItem('isLinked', String(isLinked));
    localStorage.setItem('phoneNumber', phoneNumber);
    localStorage.setItem('lastView', view);
    localStorage.setItem('iban', iban);
    localStorage.setItem('bankName', bankName);
    localStorage.setItem('accountHolder', accountHolder);
  }, [agents, conversations, logs, isLinked, phoneNumber, view, iban, bankName, accountHolder]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const log: LogEntry = { id: Date.now().toString(), timestamp: new Date().toISOString(), message, type };
    setLogs(prev => [log, ...prev].slice(0, 50));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'customer', content: newMessage, timestamp: new Date().toISOString() };
    const updatedConv = { ...activeConversation, messages: [...activeConversation.messages, userMsg], lastMessage: newMessage, unread: 0, timestamp: new Date().toISOString() };

    setConversations(prev => prev.map(c => c.id === activeConversation.id ? updatedConv : c));
    setActiveConversation(updatedConv);
    setNewMessage('');

    const agent = agents.find(a => a.id === activeConversation.agentId);
    if (agent?.isActive && isLinked) {
      setIsTyping(true);
      try {
        const history = updatedConv.messages.slice(-5).map(m => ({
          role: m.sender === 'customer' ? 'user' as const : 'model' as const,
          text: m.content
        }));
        const paymentCtx = iban ? `\nDados Bancários: ${bankName} | IBAN: ${iban} | Titular: ${accountHolder}` : '';
        const reply = await geminiService.generateReply(agent.instruction + paymentCtx, history, newMessage);
        
        const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', content: reply, timestamp: new Date().toISOString() };
        const finalConv = { ...updatedConv, messages: [...updatedConv.messages, botMsg], lastMessage: reply };
        
        setConversations(prev => prev.map(c => c.id === activeConversation.id ? finalConv : c));
        if (activeConversation.id === finalConv.id) setActiveConversation(finalConv);
      } catch (err) { addLog("Erro na resposta IA", "error"); }
      setIsTyping(false);
    }
  };

  const sendIbanQuick = () => {
    if (!iban) { setView('settings'); return; }
    const paymentText = `🏛️ *BANCO:* ${bankName}\n👤 *TITULAR:* ${accountHolder}\n💳 *IBAN:* ${iban}\n\n_Por favor, envie o comprovativo._`;
    setNewMessage(paymentText);
  };

  return (
    <div className="flex bg-[#F0F2F5] h-screen w-full overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r flex flex-col z-50">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-lg"><Zap size={22} fill="white" /></div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">AutoZap <span className="text-[#25D366]">AO</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
            { id: 'conversations', icon: MessageSquare, label: 'Conversas' },
            { id: 'agents', icon: Users, label: 'Agentes IA' },
            { id: 'link', icon: Smartphone, label: 'WhatsApp' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
            { id: 'logs', icon: Terminal, label: 'Consola' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id as ViewState)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === item.id ? 'bg-[#25D366] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t flex flex-col gap-2">
          {isLinked && (
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-green-700 uppercase">Online: {phoneNumber}</span>
            </div>
          )}
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 px-4 py-2"><LogOut size={14} /> Resetar Sistema</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between z-40">
           <div className="flex items-center gap-4">
             <Globe size={16} className="text-slate-300" />
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{view}</h2>
           </div>
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                <span className="text-xs font-bold text-slate-800">{isLinked ? 'Sincronizado' : 'Desconectado'}</span>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-full border" />
           </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-[#F0F2F5]">
          <div className="max-w-6xl mx-auto w-full h-full">
            
            {/* Dashboard View */}
            {view === 'dashboard' && (
              <div className="space-y-8 view-transition">
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Resumo Hoje</h2>
                      <p className="text-slate-500 font-medium">Controlo de automação em tempo real.</p>
                   </div>
                   <div className="bg-white px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-2">
                      <Activity size={16} className="text-[#25D366]" />
                      <span className="text-xs font-bold">API Status: OK</span>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-[32px] border shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Conversas Ativas</p>
                      <span className="text-3xl font-black">{conversations.length}</span>
                   </div>
                   <div className="bg-white p-6 rounded-[32px] border shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Agentes Online</p>
                      <span className="text-3xl font-black">{agents.filter(a => a.isActive).length}</span>
                   </div>
                   <div className="bg-[#25D366] p-6 rounded-[32px] shadow-lg text-white">
                      <p className="text-[10px] font-black text-white/70 uppercase mb-2">Status da Instância</p>
                      <span className="text-2xl font-black">{isLinked ? 'WhatsApp Conectado' : 'Aguardando Link'}</span>
                   </div>
                </div>
              </div>
            )}

            {/* Conversations View */}
            {view === 'conversations' && (
              <div className="bg-white rounded-[32px] border shadow-xl h-[calc(100vh-180px)] flex overflow-hidden view-transition">
                 <div className="w-80 border-r bg-slate-50/50 flex flex-col">
                    <div className="p-4 border-b">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input placeholder="Filtrar conversas..." className="w-full pl-9 pr-4 py-2 bg-white border rounded-xl text-xs outline-none" />
                       </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                       {conversations.map(c => (
                         <div key={c.id} onClick={() => setActiveConversation(c)} className={`p-4 border-b cursor-pointer transition-colors ${activeConversation?.id === c.id ? 'bg-white border-r-4 border-r-[#25D366]' : 'hover:bg-white'}`}>
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-sm font-bold text-slate-800">{c.contactName}</span>
                               <span className="text-[9px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="flex-1 flex flex-col">
                    {activeConversation ? (
                      <>
                        <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white font-bold">{activeConversation.contactName[0]}</div>
                              <div>
                                 <h4 className="text-sm font-bold text-slate-800">{activeConversation.contactName}</h4>
                                 <p className="text-[10px] text-slate-400">{activeConversation.contactNumber}</p>
                              </div>
                           </div>
                           <button onClick={sendIbanQuick} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#25D366] transition-colors"><CreditCard size={14} /> Dados IBAN</button>
                        </div>
                        <div className="flex-1 p-6 overflow-auto bg-[#e5ddd5] space-y-4">
                           {activeConversation.messages.map(m => (
                             <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${m.sender === 'customer' ? 'bg-white rounded-tl-none' : 'bg-[#dcf8c6] rounded-tr-none'}`}>
                                   <p className="whitespace-pre-wrap">{m.content}</p>
                                   <div className="text-[9px] text-slate-400 text-right mt-1">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                </div>
                             </div>
                           ))}
                           {isTyping && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">IA a escrever...</div>}
                        </div>
                        <div className="p-4 border-t bg-white">
                           <div className="flex gap-2">
                              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Simular mensagem ou responder..." className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-3 outline-none focus:ring-2 focus:ring-[#25D366] transition-all" />
                              <button onClick={handleSendMessage} className="bg-[#25D366] text-white p-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={20} /></button>
                           </div>
                        </div>
                      </>
                    ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><MessageSquare size={64} className="mb-4 opacity-20" /><span className="font-black uppercase tracking-widest">Selecione uma Conversa</span></div>}
                 </div>
              </div>
            )}

            {/* Link WhatsApp View */}
            {view === 'link' && (
              <div className="max-w-md mx-auto view-transition pt-12">
                 {!isLinked ? (
                   <div className="bg-white p-10 rounded-[40px] border shadow-2xl text-center space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Conectar Instância</h2>
                        <p className="text-slate-500 text-sm">Vincule seu WhatsApp de Angola para automação em tempo real.</p>
                      </div>
                      <div className="relative">
                         <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+244 9XX XXX XXX" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center text-2xl font-black outline-none focus:border-[#25D366] transition-all" />
                      </div>
                      <button onClick={() => { setIsLinking(true); setTimeout(() => { setIsLinked(true); setIsLinking(false); addLog(`Conectado ao número ${phoneNumber}`, "success"); }, 2500); }} 
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl hover:bg-[#25D366] transition-all flex items-center justify-center gap-3">
                         {isLinking ? <RefreshCw className="animate-spin" /> : <QrCode />} {isLinking ? 'AUTENTICANDO...' : 'GERAR QR CODE'}
                      </button>
                      {isLinking && <div className="p-8 border-4 border-dashed rounded-[40px] animate-pulse flex items-center justify-center bg-slate-50"><QrCode size={120} className="text-slate-200" /></div>}
                   </div>
                 ) : (
                   <div className="bg-white p-12 rounded-[40px] border shadow-xl text-center space-y-6 animate-in zoom-in">
                      <div className="w-20 h-20 bg-green-50 text-[#25D366] rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={48} /></div>
                      <h3 className="text-2xl font-black text-slate-800">WhatsApp Vinculado</h3>
                      <p className="text-slate-500 font-medium">O seu sistema está pronto para responder em tempo real.</p>
                      <button onClick={() => setIsLinked(false)} className="w-full text-red-400 font-bold hover:bg-red-50 py-3 rounded-2xl transition-colors">Desconectar Dispositivo</button>
                   </div>
                 )}
              </div>
            )}

            {/* SETTINGS VIEW - CORRIGIDA E COMPLETA */}
            {view === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-8 view-transition">
                 <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Definições</h2>
                    <p className="text-slate-500 font-medium">Configure as regras do seu ecossistema digital.</p>
                 </div>

                 <div className="bg-white rounded-[40px] border p-10 shadow-xl space-y-10">
                    <div className="flex items-center gap-4 border-b pb-6">
                       <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><CreditCard size={28} /></div>
                       <div>
                          <h3 className="text-xl font-black text-slate-800">Gestão de Pagamentos</h3>
                          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">IBAN Angolano para Faturação</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição Bancária</label>
                          <div className="relative">
                             <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="BAI">BAI - Banco Angolano de Investimentos</option>
                                <option value="BFA">BFA - Banco de Fomento Angola</option>
                                <option value="BIC">BIC - Banco BIC</option>
                                <option value="SOL">Banco SOL</option>
                                <option value="Standard Bank">Standard Bank Angola</option>
                                <option value="ATLANTICO">Banco Millennium Atlântico</option>
                                <option value="KEVE">Banco KEVE</option>
                             </select>
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titular da Conta</label>
                          <div className="relative">
                             <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Ex: Nome Completo da Empresa" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-blue-500 transition-all" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número IBAN (AO06...)</label>
                          <div className="relative">
                             <Copy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input value={iban} onChange={e => setIban(e.target.value.toUpperCase())} placeholder="AO06 0000 0000 0000 0000 0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 font-bold outline-none focus:border-blue-500 transition-all tracking-widest" />
                          </div>
                       </div>
                    </div>

                    <button onClick={() => { addLog("Configurações de IBAN salvas", "success"); alert("Sucesso: Definições de pagamento atualizadas em tempo real!"); }} 
                      className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl transition-all active:scale-[0.98]">
                       Sincronizar Definições
                    </button>
                 </div>

                 <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">Nota: O IBAN configurado aqui será usado pela Inteligência Artificial para responder a clientes que solicitem dados de pagamento.</p>
                 </div>
              </div>
            )}

            {/* Logs View */}
            {view === 'logs' && (
              <div className="space-y-6 view-transition h-full">
                 <h2 className="text-4xl font-black text-slate-900">Monitor de Sistema</h2>
                 <div className="bg-slate-900 text-green-400 p-8 rounded-[40px] font-mono text-xs h-[500px] overflow-auto shadow-2xl border-4 border-slate-800">
                    <div className="flex flex-col gap-2">
                       {logs.length === 0 ? <p className="opacity-40 italic">Iniciando logs em tempo real...</p> : logs.map(l => (
                         <div key={l.id} className="border-b border-white/5 pb-2">
                           <span className="opacity-50">[{new Date(l.timestamp).toLocaleTimeString()}]</span> <span className={`font-bold ${l.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>{l.type.toUpperCase()}</span>: {l.message}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {/* Agents View */}
            {view === 'agents' && (
              <div className="space-y-8 view-transition">
                 <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Agentes IA</h2>
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#25D366] text-white px-8 py-4 rounded-3xl font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all"><Plus size={20} /> CRIAR AGENTE</button>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {agents.map(a => (
                       <div key={a.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col gap-6 relative group overflow-hidden">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <img src={a.avatar} className="w-16 h-16 rounded-3xl border shadow-inner" />
                                <div>
                                   <h3 className="font-black text-slate-800 text-lg">{a.name}</h3>
                                   <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase">{a.role}</span>
                                </div>
                             </div>
                             <button onClick={() => setAgents(prev => prev.filter(x => x.id !== a.id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-3xl text-sm italic text-slate-600 border border-slate-100 leading-relaxed font-medium">"{a.instruction}"</div>
                          <div className="flex items-center justify-between pt-2">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${a.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[10px] font-black uppercase text-slate-400">{a.isActive ? 'Ativo e Monitorando' : 'Offline'}</span>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={a.isActive} onChange={() => setAgents(prev => prev.map(x => x.id === a.id ? {...x, isActive: !x.isActive} : x))} />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                             </label>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Simplified Create Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in border-8 border-white">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Configurar Agente</h3>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-slate-400 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome</label>
                    <input id="new-agent-name" placeholder="Ex: Vendas Online" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Instrução Base</label>
                    <textarea id="new-agent-prompt" rows={4} placeholder="Como o agente deve responder?" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-medium outline-none resize-none" />
                 </div>
              </div>
              <div className="p-8 bg-slate-50 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-slate-400 py-4">Descartar</button>
                 <button onClick={() => {
                   const name = (document.getElementById('new-agent-name') as HTMLInputElement).value;
                   const prompt = (document.getElementById('new-agent-prompt') as HTMLTextAreaElement).value;
                   if(!name || !prompt) return;
                   const newAgent: Agent = {
                     id: Date.now().toString(), name, role: AgentRole.SALES, instruction: prompt, isActive: true,
                     avatar: `https://ui-avatars.com/api/?name=${name}&background=25D366&color=fff`
                   };
                   setAgents(prev => [...prev, newAgent]);
                   setIsModalOpen(false);
                   addLog(`Agente ${name} criado`, "success");
                 }} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black shadow-lg">ATIVAR AGENTE</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
