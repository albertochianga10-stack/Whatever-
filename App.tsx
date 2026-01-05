
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Plus, 
  Search, 
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  QrCode,
  LogOut,
  X,
  Edit3,
  Terminal,
  Activity,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { ViewState, Agent, Conversation, AgentRole, Message, LogEntry } from './types';
import { geminiService } from './services/geminiService';

const INITIAL_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Consultor AO Express',
    role: AgentRole.SALES,
    instruction: 'Venda serviços de logística em Luanda. Seja muito profissional e use "Nguami" ou "Kambas" apenas se o cliente for muito informal.',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    contactName: 'Januário Bento',
    contactNumber: '+244 923 111 222',
    lastMessage: 'A encomenda já chegou no Porto de Luanda?',
    timestamp: new Date(),
    unread: 1,
    messages: [
      { id: 'm1', sender: 'customer', content: 'Bom dia, gostaria de saber o status do meu contentor.', timestamp: new Date(Date.now() - 7200000) },
      { id: 'm2', sender: 'customer', content: 'A encomenda já chegou no Porto de Luanda?', timestamp: new Date() }
    ],
    agentId: '1'
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36),
      timestamp: new Date(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (isLinked) {
      addLog(`Instância conectada ao número ${phoneNumber}`, 'success');
    }
  }, [isLinked]);

  const Sidebar = () => (
    <div className="w-64 bg-white border-r h-screen flex flex-col sticky top-0 shadow-sm z-30">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
          <Zap size={22} fill="currentColor" />
        </div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">AutoZap <span className="text-[#25D366]">AO</span></h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Principal' },
          { id: 'conversations', icon: MessageSquare, label: 'Conversas Vivas' },
          { id: 'agents', icon: Users, label: 'Agentes AI' },
          { id: 'link', icon: Smartphone, label: 'Gestor de Instância' },
          { id: 'logs', icon: Terminal, label: 'Consola de Logs' },
          { id: 'settings', icon: Settings, label: 'Configurações' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              view === item.id ? 'bg-[#25D366] text-white font-bold shadow-lg shadow-green-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t space-y-4">
        {isLinked && (
          <div className="bg-green-50 p-3 rounded-xl border border-green-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-green-600 uppercase">Online</span>
              <Wifi size={12} className="text-green-500" />
            </div>
            <p className="text-xs font-bold text-green-800 truncate">{phoneNumber}</p>
          </div>
        )}
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm">
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>
    </div>
  );

  const InstanceLogs = () => (
    <div className="p-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Consola de Depuração</h2>
          <p className="text-gray-500 font-medium">Monitorização em tempo real das mensagens e eventos da IA.</p>
        </div>
        <button 
          onClick={() => setLogs([])}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Limpar Logs"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      
      <div className="bg-[#111] rounded-[32px] p-6 font-mono text-sm h-[600px] overflow-y-auto shadow-2xl border-4 border-gray-800">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">Aguardando eventos da instância...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2">
                <span className="text-gray-500 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );

  const LinkWhatsApp = () => (
    <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[85vh] space-y-12">
      {isLinked ? (
        <div className="bg-white p-12 rounded-[40px] border shadow-2xl space-y-8 max-w-md w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-50 text-[#25D366] rounded-full flex items-center justify-center mx-auto border-4 border-[#25D366]/10">
            <CheckCircle2 size={56} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-gray-800">Instância Activa</h2>
            <p className="text-gray-500 font-medium">A sua conta de Angola está conectada via Socket.IO.</p>
          </div>
          
          <div className="space-y-3">
             <div className="p-4 bg-gray-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Uptime</span>
                <span className="text-sm font-black text-gray-800">02:14:45</span>
             </div>
             <div className="p-4 bg-gray-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Mensagens Hoje</span>
                <span className="text-sm font-black text-gray-800">128</span>
             </div>
          </div>

          <div className="space-y-3 pt-4">
            <button className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-100" onClick={() => setView('dashboard')}>Ir para o Painel</button>
            <button className="w-full text-red-500 font-bold py-2 hover:bg-red-50 rounded-xl transition-all" onClick={() => {
               setIsLinked(false);
               addLog("Sessão terminada pelo utilizador", "warning");
            }}>Desconectar Agora</button>
          </div>
        </div>
      ) : (
        <div className="space-y-12 w-full max-w-4xl animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Conectar via Real-Time API</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Vincule o seu número (+244) para começar a automatizar com Gemini 2.0.</p>
          </div>

          {!isLinking && !phoneNumber ? (
            <div className="bg-white p-10 rounded-[40px] border shadow-2xl max-w-md mx-auto space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 uppercase">Teu Número de Angola</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">+244</span>
                    <input 
                      type="text" 
                      placeholder="9XX XXX XXX" 
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-16 focus:border-[#25D366] outline-none font-bold text-lg transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.length >= 9) setPhoneNumber(`+244 ${val}`);
                        }
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">Pressione Enter para registar a instância.</p>
               </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
               <div className="bg-white p-10 rounded-[48px] border-8 border-gray-50 shadow-2xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                  <div className="w-72 h-72 bg-white rounded-3xl flex items-center justify-center border-4 border-dashed border-gray-100 relative z-10">
                     {isLinking ? (
                        <div className="flex flex-col items-center gap-4">
                           <Activity size={48} className="text-[#25D366] animate-bounce" />
                           <span className="text-sm font-black text-gray-500">A VALIDAR QR CODE...</span>
                        </div>
                     ) : (
                        <QrCode size={220} className="text-gray-900 group-hover:scale-110 transition-transform duration-500" />
                     )}
                  </div>
                  <div className="mt-8 relative z-10">
                     <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all" onClick={() => {
                        addLog("Gerando novo par de chaves RSA para conexão segura...", "info");
                        setIsLinking(true);
                        setTimeout(() => {
                          addLog("QR Code lido com sucesso pela câmara do telemóvel", "success");
                          addLog(`Sessão estabelecida para o número ${phoneNumber}`, "success");
                          setIsLinking(false); 
                          setIsLinked(true); 
                        }, 3000);
                     }}>
                        Simular Scan QR Code
                     </button>
                  </div>
               </div>

               <div className="max-w-sm text-left space-y-6">
                  <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
                    <h3 className="font-black text-lg border-b border-white/10 pb-2 flex items-center gap-2">
                       <Terminal size={18} /> Instruções AO
                    </h3>
                    <ul className="space-y-4 text-sm font-medium text-gray-400">
                       <li className="flex gap-3">
                          <span className="text-white font-black">01.</span> Abra o WhatsApp no seu telemóvel angolano.
                       </li>
                       <li className="flex gap-3">
                          <span className="text-white font-black">02.</span> Vá a Aparelhos Conectados > Conectar um Aparelho.
                       </li>
                       <li className="flex gap-3">
                          <span className="text-white font-black">03.</span> Aponte para o ecrã e aguarde a sincronização.
                       </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex gap-3 text-xs text-green-700 font-bold">
                    <CheckCircle2 size={18} className="shrink-0" />
                    Gateway optimizado para redes de Angola (Unitel/Movicel).
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const Dashboard = () => (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[#25D366] font-black uppercase text-xs tracking-[0.2em] mb-1">Status em Tempo Real</p>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Fluxo de Trabalho</h2>
        </div>
        <div className={`px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 ${isLinked ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
           <Activity size={18} className={isLinked ? 'animate-pulse' : ''} />
           <span className="text-sm font-black uppercase tracking-tight">
              {isLinked ? 'Sistema em Operação' : 'Sistema em Pausa'}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Msgs Recebidas', value: '428', icon: MessageSquare },
          { label: 'IA Replied', value: '100%', icon: Zap },
          { label: 'Tempo Médio AO', value: '1.2s', icon: Activity },
          { label: 'Custo de Token', value: '0.04$', icon: RefreshCw },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-xl transition-all duration-300">
             <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mb-4">
                <stat.icon size={20} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{stat.label}</p>
             <span className="text-2xl font-black text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
               <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">Actividade do Socket</h3>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" />
                  </div>
               </div>
               <div className="p-0">
                  {logs.slice(0, 5).map((log, i) => (
                    <div key={log.id} className="p-4 border-b flex items-center gap-4 text-xs font-medium">
                       <span className="text-gray-400">[{log.timestamp.toLocaleTimeString()}]</span>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                         log.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                       }`}>{log.type}</span>
                       <span className="text-gray-600 truncate">{log.message}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
         
         <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#25D366] blur-[100px] opacity-20" />
            <h3 className="text-2xl font-black mb-4 italic">Monitor AO</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
               A tua instância está a processar eventos a partir do DataCenter de Luanda. Latência actual: 45ms.
            </p>
            <button onClick={() => setView('logs')} className="bg-white text-black py-4 w-full rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">Ver Debug Completo</button>
         </div>
      </div>
    </div>
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'customer',
      content: newMessage,
      timestamp: new Date()
    };

    addLog(`Mensagem recebida de ${activeConversation.contactName}: "${newMessage}"`, 'info');

    const updatedConv = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMsg],
      lastMessage: newMessage,
      unread: 0
    };

    setConversations(conversations.map(c => c.id === activeConversation.id ? updatedConv : c));
    setActiveConversation(updatedConv);
    setNewMessage('');

    const activeAgent = agents.find(a => a.id === activeConversation.agentId);
    if (activeAgent?.isActive && isLinked) {
      setIsTyping(true);
      addLog(`IA está a processar resposta via Gemini 3 Flash...`, 'info');
      
      setTimeout(async () => {
        const history = updatedConv.messages.slice(-5).map(m => ({
          role: m.sender === 'customer' ? 'user' as const : 'model' as const,
          text: m.content
        }));

        const reply = await geminiService.generateReply(activeAgent.instruction, history, newMessage);
        
        setIsTyping(false);
        addLog(`IA gerou resposta: "${reply.slice(0, 30)}..."`, 'success');

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          content: reply,
          timestamp: new Date()
        };

        const finalConv = {
          ...updatedConv,
          messages: [...updatedConv.messages, botMsg],
          lastMessage: reply
        };

        setConversations(conversations.map(c => c.id === activeConversation.id ? finalConv : c));
        if (activeConversation.id === finalConv.id) {
          setActiveConversation(finalConv);
        }
      }, 2000);
    } else if (!isLinked) {
       addLog("Erro: Mensagem recebida mas instância está desconectada!", "error");
    }
  };

  return (
    <div className="flex bg-[#F0F2F5] min-h-screen font-['Inter']">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b flex items-center px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">{view}</h2>
             {isLinked && (
               <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Conexão Socket Estável</span>
               </div>
             )}
          </div>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl shadow-gray-200">A</div>
          </div>
        </header>

        {view === 'dashboard' && <Dashboard />}
        {view === 'agents' && (
          <div className="p-8 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-end">
                <div>
                  <p className="text-[#25D366] font-black uppercase text-xs tracking-[0.2em] mb-1">Configuração de Resposta</p>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Agentes de Luanda</h2>
                </div>
                <button onClick={() => { setEditingAgent(null); setIsModalOpen(true); }} className="bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:brightness-105 shadow-xl shadow-green-100 transition-all">
                  <Plus size={22} /> NOVO AGENTE
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {agents.map(agent => (
                 <div key={agent.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col h-full hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[40px] flex items-center justify-center text-green-500 opacity-20">
                       <Zap size={40} />
                    </div>
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-[24px] object-cover ring-4 ring-gray-50 shadow-md" />
                        <div>
                          <h3 className="text-xl font-black text-gray-800 mb-1">{agent.name}</h3>
                          <span className="text-[10px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-500 uppercase tracking-widest">{agent.role}</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={agent.isActive} onChange={() => {
                          setAgents(agents.map(a => a.id === agent.id ? {...a, isActive: !a.isActive} : a));
                          addLog(`Agente ${agent.name} ${!agent.isActive ? 'Activado' : 'Desactivado'}`, 'warning');
                        }} />
                        <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                    <div className="flex-1 bg-gray-50 p-6 rounded-3xl border mb-6 relative italic text-sm text-gray-600 leading-relaxed font-medium">
                      "{agent.instruction}"
                    </div>
                    <button onClick={() => { setEditingAgent(agent); setIsModalOpen(true); }} className="w-full py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                       <Edit3 size={16} /> Editar Personalidade
                    </button>
                 </div>
               ))}
             </div>
          </div>
        )}
        {view === 'link' && <LinkWhatsApp />}
        {view === 'logs' && <InstanceLogs />}
        {view === 'conversations' && (
           <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
              <div className="w-80 border-r flex flex-col bg-gray-50/30">
                 <div className="p-4 border-b bg-white">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                       <input type="text" placeholder="Procurar em Luanda..." className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all text-sm font-medium" />
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => (
                       <div key={conv.id} onClick={() => setActiveConversation(conv)} className={`p-4 flex gap-4 cursor-pointer transition-all ${activeConversation?.id === conv.id ? 'bg-[#25D366]/5 border-r-4 border-r-[#25D366]' : 'hover:bg-white'}`}>
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                             {conv.contactName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-0.5">
                                <h4 className="font-bold text-gray-800 truncate text-sm">{conv.contactName}</h4>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Hoje</span>
                             </div>
                             <p className="text-xs text-gray-500 truncate leading-tight font-medium">{conv.lastMessage}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex-1 flex flex-col bg-white">
                 {activeConversation ? (
                    <>
                       <div className="p-4 border-b flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">
                                {activeConversation.contactName[0]}
                             </div>
                             <div>
                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{activeConversation.contactName}</h4>
                                <p className="text-[10px] text-green-500 font-black flex items-center gap-1">
                                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> CONECTADO • {activeConversation.contactNumber}
                                </p>
                             </div>
                          </div>
                       </div>
                       <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/30">
                          {activeConversation.messages.map((msg) => (
                             <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-right-2'}`}>
                                <div className={`max-w-[80%] px-5 py-3 rounded-[24px] shadow-sm text-sm relative ${
                                   msg.sender === 'customer' ? 'bg-white text-gray-800 rounded-tl-none border' : 'bg-[#DCF8C6] text-gray-800 rounded-tr-none'
                                }`}>
                                   <p className="leading-relaxed font-medium">{msg.content}</p>
                                   <div className="text-[9px] mt-1 opacity-40 text-right font-black">
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                             </div>
                          ))}
                          {isTyping && (
                            <div className="flex justify-end animate-pulse">
                               <div className="bg-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">IA está a escrever...</div>
                            </div>
                          )}
                       </div>
                       <div className="p-4 bg-white border-t">
                          <div className="flex gap-3 max-w-4xl mx-auto">
                             <input 
                                type="text" value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Simular mensagem do cliente (Receber no sistema)..." 
                                className="flex-1 bg-gray-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-[#25D366] focus:bg-white outline-none font-medium shadow-inner transition-all"
                             />
                             <button onClick={handleSendMessage} className="bg-[#25D366] text-white p-5 rounded-2xl hover:brightness-110 active:scale-90 shadow-xl shadow-green-100 transition-all">
                                <Send size={24} />
                             </button>
                          </div>
                       </div>
                    </>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
                       <div className="w-32 h-32 bg-white rounded-[48px] shadow-2xl flex items-center justify-center text-gray-100 mb-8 rotate-12">
                          <MessageSquare size={64} />
                       </div>
                       <h3 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter">Fluxo de Conversas</h3>
                       <p className="text-gray-400 font-medium max-w-xs leading-relaxed">
                          Os eventos do seu número angolano aparecerão aqui em tempo real.
                       </p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </main>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200 border-8 border-white">
              <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-gray-800 tracking-tighter">{editingAgent ? 'Ajustar Agente' : 'Criar Novo Cérebro'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Apelido do Agente</label>
                    <input 
                      type="text" 
                      defaultValue={editingAgent?.name}
                      placeholder="Ex: Suporte Luanda Sul"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-[#25D366] outline-none font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Função Principal</label>
                    <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none">
                       {Object.values(AgentRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prompt de Comportamento</label>
                    <textarea 
                      rows={4} 
                      defaultValue={editingAgent?.instruction}
                      placeholder="Como deve falar com os clientes em Angola?"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-[#25D366] outline-none font-medium resize-none"
                    />
                 </div>
              </div>
              <div className="p-8 bg-gray-50 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-gray-500 hover:bg-gray-200 rounded-2xl transition-all">Cancelar</button>
                 <button onClick={() => { setIsModalOpen(false); addLog("Agente actualizado com sucesso", "success"); }} className="flex-1 py-4 font-black bg-[#25D366] text-white rounded-2xl shadow-xl shadow-green-100 hover:scale-105 transition-all">Guardar Cérebro</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
