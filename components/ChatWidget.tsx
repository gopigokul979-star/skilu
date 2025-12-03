
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, Mic, Paperclip, Check, Loader2, User as UserIcon, Lock, Users, ChevronLeft, Expand, Minimize, Search } from 'lucide-react';
import { User, UserRole, ChatRoom, ConversationMessage } from '../types';
import { MOCK_CHAT_ROOMS, MOCK_CHAT_MESSAGES, MOCK_USERS_LIST } from '../data/mockData';

interface ChatWidgetProps {
  currentUser: User;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>(MOCK_CHAT_ROOMS);
  const [messages, setMessages] = useState<ConversationMessage[]>(MOCK_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  
  // New Chat State
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoomId, isOpen, isFullScreen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Filtering Rooms based on Role ---
  const getVisibleRooms = () => {
    const baseRooms = (currentUser.role === UserRole.ADMIN) 
      ? rooms
      : rooms.filter(r => r.participants.includes(currentUser.id));
      
    return baseRooms.filter(r => 
        r.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
        r.recipientName?.toLowerCase().includes(chatSearch.toLowerCase())
    );
  };

  // --- Actions ---

  const handleSendMessage = (type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE' = 'TEXT', content: string = inputText) => {
    if ((type === 'TEXT' && !content.trim()) || !activeRoomId) return;

    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      roomId: activeRoomId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: type === 'TEXT' ? content : (type === 'AUDIO' ? 'Voice Message' : 'Attachment'),
      timestamp: Date.now(),
      type: type,
      attachmentUrl: type !== 'TEXT' ? content : undefined,
      duration: type === 'AUDIO' ? recordingDuration : undefined
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Update room last message
    setRooms(rooms.map(r => r.id === activeRoomId ? {
      ...r,
      lastMessage: type === 'TEXT' ? content : `Sent a ${type.toLowerCase()}`,
      lastMessageTime: Date.now()
    } : r));
  };

  const handleCreatePrivateChat = (recipientId: string) => {
    const recipient = MOCK_USERS_LIST.find(u => u.id === recipientId);
    if (!recipient) return;

    const newRoom: ChatRoom = {
      id: `room_p_${Date.now()}`,
      name: recipient.name, // Use recipient name for private chats
      type: 'PRIVATE',
      participants: [currentUser.id, recipientId],
      status: 'PENDING', // Needs approval
      unreadCount: 0,
      recipientId: recipient.id,
      recipientName: recipient.name,
      lastMessage: 'Chat request sent',
      lastMessageTime: Date.now()
    };

    setRooms([newRoom, ...rooms]);
    setShowNewChat(false);
    setActiveRoomId(newRoom.id);
  };

  const handleRoomAction = (roomId: string, action: 'ACCEPT' | 'REJECT') => {
    if (action === 'REJECT') {
      setRooms(rooms.filter(r => r.id !== roomId));
      if (activeRoomId === roomId) setActiveRoomId(null);
    } else {
      setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'ACTIVE' } : r));
    }
  };

  // --- Recording Simulation ---
  const toggleRecording = () => {
    if (isRecording) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      handleSendMessage('AUDIO', 'mock_audio_url.mp3');
      setRecordingDuration(0);
    } else {
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'FILE') => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMessage(type, URL.createObjectURL(file));
    }
  };

  // --- Render Helpers ---
  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const roomMessages = messages.filter(m => m.roomId === activeRoomId);
  const visibleRooms = getVisibleRooms();

  const getAvailableUsers = () => {
    if (currentUser.role === UserRole.STUDENT) {
       const myTeachers = MOCK_USERS_LIST.filter(u => u.role === UserRole.TEACHER);
       const admins = MOCK_USERS_LIST.filter(u => u.role === UserRole.ADMIN);
       return [...admins, ...myTeachers];
    }
    return [];
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 hover:scale-110 flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
      ${isFullScreen 
        ? 'inset-0 md:inset-4 rounded-none md:rounded-2xl w-auto h-auto max-h-none' 
        : 'bottom-6 right-4 md:right-8 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh]'
      }`}>
      
      {/* Header */}
      <div className="bg-white p-4 flex justify-between items-center border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {(activeRoomId || showNewChat) && (
            <button onClick={() => { setActiveRoomId(null); setShowNewChat(false); }} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full">
              <ChevronLeft size={20} />
            </button>
          )}
          {activeRoom ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                 {/* Placeholder for recipient avatar */}
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${activeRoom.type === 'BATCH_GROUP' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    {activeRoom.name.charAt(0)}
                 </div>
                 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="truncate">
                <h3 className="font-bold text-sm md:text-base text-slate-800 truncate">
                  {activeRoom.name}
                </h3>
                <p className="text-[10px] text-emerald-600 font-semibold">Online</p>
              </div>
            </div>
          ) : (
            <h3 className="font-bold text-sm md:text-base text-slate-800">
              {showNewChat ? 'Start New Chat' : 'Messages'}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            {isFullScreen ? <Minimize size={18} /> : <Expand size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-slate-50/50">
        
        {/* ROOM LIST VIEW */}
        {!activeRoomId && !showNewChat && (
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-white">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search chats..." 
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      className="w-full bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {(currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) && 
                  visibleRooms.some(r => r.status === 'PENDING') && (
                  <div className="mb-2">
                     <h4 className="text-xs font-bold text-slate-500 uppercase px-2 mb-1">Requests</h4>
                     {visibleRooms.filter(r => r.status === 'PENDING').map(room => (
                       <div key={room.id} className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center shadow-sm mb-2">
                          <div>
                            <div className="font-bold text-sm text-slate-800">{room.recipientName}</div>
                            <div className="text-xs text-slate-500">Wants to chat</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRoomAction(room.id, 'REJECT')} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded"><X size={14}/></button>
                            <button onClick={() => handleRoomAction(room.id, 'ACCEPT')} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"><Check size={14}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
                {visibleRooms.filter(r => r.status === 'ACTIVE').map(room => {
                  const recipient = MOCK_USERS_LIST.find(u => u.id === room.recipientId);
                  return (
                  <div key={room.id} onClick={() => setActiveRoomId(room.id)} className="bg-white p-3 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer flex gap-3 items-center group mb-2 border border-transparent">
                     <div className="relative flex-shrink-0">
                         {room.type === 'PRIVATE' && recipient ? (
                             <img src={recipient.avatar} alt={recipient.name} className="w-10 h-10 rounded-full" />
                         ) : (
                             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600"><Users size={18} /></div>
                         )}
                         {room.unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"> {room.unreadCount}</div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                           <h4 className="font-bold text-sm text-slate-800 truncate">{room.name}</h4>
                           <span className="text-[10px] text-slate-400">{room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{room.lastMessage || 'No messages yet'}</p>
                     </div>
                  </div>
                )})}
             </div>
             {currentUser.role === UserRole.STUDENT && (
                  <div className="p-2 border-t border-slate-100 bg-white">
                    <button onClick={() => setShowNewChat(true)} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
                      + New Private Chat
                    </button>
                  </div>
                )}
          </div>
        )}

        {/* NEW CHAT VIEW */}
        {showNewChat && (
          <div className="h-full overflow-y-auto p-2">
             {getAvailableUsers().map(user => (
               <button key={user.id} onClick={() => handleCreatePrivateChat(user.id)} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mb-2 text-left">
                 <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                 <div>
                   <div className="font-bold text-sm text-slate-800">{user.name}</div>
                   <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                 </div>
               </button>
             ))}
          </div>
        )}

        {/* ACTIVE ROOM VIEW */}
        {activeRoom && (
          <div className="h-full flex flex-col">
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {activeRoom.status === 'PENDING' ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400"><Lock size={32} /></div>
                    <h4 className="font-bold text-slate-700">Request Pending</h4>
                    <p className="text-sm mt-2">You can send messages once the request is accepted.</p>
                 </div>
               ) : (
                 <>
                   {roomMessages.map(msg => {
                     const isMe = msg.senderId === currentUser.id;
                     return (
                       <div key={msg.id} className="flex flex-col">
                         {!isMe && activeRoom.type === 'BATCH_GROUP' && <div className="text-[10px] text-slate-500 font-bold mb-1 ml-10">{msg.senderName}</div>}
                         <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                               {msg.senderName.charAt(0)}
                            </div>
                            <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
                               {msg.type === 'TEXT' && <p className="leading-relaxed">{msg.text}</p>}
                               {msg.type === 'IMAGE' && <img src={msg.attachmentUrl} alt="attachment" className="rounded-lg max-w-full" />}
                               {msg.type === 'AUDIO' && <div className="flex items-center gap-2"><button className="p-1 bg-white/20 rounded-full"><div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-current border-b-4 border-b-transparent ml-0.5"></div></button><div className="h-1 bg-current/30 w-24 rounded-full"></div><span className="text-[10px] opacity-70">{msg.duration}s</span></div>}
                               {msg.type === 'FILE' && <div className="flex items-center gap-2"><Paperclip size={16} /><span className="underline">Attachment</span></div>}
                            </div>
                         </div>
                       </div>
                     )
                   })}
                   <div ref={messagesEndRef} />
                 </>
               )}
             </div>
             {activeRoom.status === 'ACTIVE' && (
               <div className="p-3 bg-white border-t border-slate-100">
                 {isRecording ? (
                    <div className="flex items-center justify-between bg-red-50 text-red-600 px-4 py-3 rounded-full animate-pulse">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-600 rounded-full"></div><span className="font-bold text-sm">Recording {recordingDuration}s...</span></div>
                        <button onClick={toggleRecording} className="p-1 bg-white rounded-full text-red-600 shadow-sm"><Send size={16} /></button>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                        <label className="p-2 text-slate-400 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"><ImageIcon size={20} /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'IMAGE')} /></label>
                        <div className="flex-1 bg-slate-100 rounded-full flex items-center px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
                           <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"/>
                        </div>
                        <button onClick={toggleRecording} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Mic size={20} /></button>
                        <button onClick={() => handleSendMessage()} disabled={!inputText.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"><Send size={18} /></button>
                    </div>
                 )}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;