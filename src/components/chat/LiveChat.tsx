import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Send,
  Paperclip,
  Users,
  Search,
  MoreVertical,
  Phone,
  Video,
  Share2,
  Calendar,
  FileText,
  Brain,
  User,
  MessageCircle,
  Hash,
  Plus,
  X,
  Check,
  Clock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'shared_content' | 'file';
  sharedContent?: {
    type: 'ai_insight' | 'client_update' | 'journal_entry' | 'calendar_event' | 'deal' | 'task';
    title: string;
    description: string;
    data: any;
  };
  reactions?: { emoji: string; users: string[] }[];
  isRead?: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export default function LiveChat() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // API functions for chat functionality
  const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data.map(user => ({
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      avatar: user.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20person%20headshot%20portrait&image_size=square`,
      isOnline: user.is_online || false,
      lastSeen: user.last_seen ? new Date(user.last_seen) : undefined,
    }));
  };

  const [users, setUsers] = useState<User[]>([]);

  const fetchChatRooms = async (): Promise<ChatRoom[]> => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_participants!inner(user_id),
        chat_messages(content, created_at)
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
    
    return data.map(room => {
      const lastMessage = room.chat_messages?.[room.chat_messages.length - 1];
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        participants: room.chat_participants.map((p: any) => p.user_id),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          senderId: lastMessage.sender_id,
          senderName: lastMessage.sender_name,
          content: lastMessage.content,
          timestamp: new Date(lastMessage.created_at),
          type: lastMessage.message_type,
          isRead: lastMessage.is_read
        } : undefined,
        unreadCount: 0, // TODO: Implement unread count logic
      };
    });
  };

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  const fetchMessages = async (roomId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users(full_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.users?.full_name || 'Unknown User',
      senderAvatar: msg.users?.avatar_url,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      type: msg.message_type,
      sharedContent: msg.shared_content,
      reactions: [], // TODO: Implement reactions
      isRead: msg.is_read
    }));
  };

  const sendMessageToRoom = async (roomId: string, content: string, type: 'text' | 'shared_content' = 'text', sharedContent?: any) => {
    try {
      const messageData: any = {
        room_id: roomId,
        sender_id: user?.id,
        content,
        message_type: type
      };

      if (sharedContent) {
        messageData.shared_content = JSON.stringify(sharedContent);
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      // Refresh messages
      const updatedMessages = await fetchMessages(roomId);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const [usersData, roomsData] = await Promise.all([
        fetchUsers(),
        fetchChatRooms()
      ]);
      setUsers(usersData);
      setChatRooms(roomsData);
    };
    loadData();
  }, []);

  useEffect(() => {
    // Load messages when room is selected
    if (selectedRoom) {
      const loadMessages = async () => {
        const messagesData = await fetchMessages(selectedRoom);
        setMessages(messagesData);
      };
      loadMessages();
    }
  }, [selectedRoom]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoom) return;

    await sendMessageToRoom(selectedRoom, message.trim());
    setMessage('');
    
    // Refresh chat rooms to update last message
    const updatedRooms = await fetchChatRooms();
    setChatRooms(updatedRooms);
    
    toast.success('Message sent');
  };

  const handleShareContent = async (contentType: string, title: string, description: string, data: any) => {
    if (!selectedRoom) return;

    const sharedContentData = {
      type: contentType as any,
      title,
      description,
      data
    };

    await sendMessageToRoom(selectedRoom, `Shared: ${title}`, 'shared_content', sharedContentData);
    setShowShareModal(false);
    
    // Refresh chat rooms to update last message
    const updatedRooms = await fetchChatRooms();
    setChatRooms(updatedRooms);
    
    toast.success('Content shared successfully');
  };

  const createChatRoom = async (participantIds: string[], roomName: string, roomType: 'direct' | 'group') => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          type: roomType
        })
        .select()
        .single();

      if (error) throw error;

      // Add participants including current user
      const participantInserts = [
        { room_id: data.id, user_id: user?.id },
        ...participantIds.map(id => ({ room_id: data.id, user_id: id }))
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantError) throw participantError;

      return data.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast.error('Failed to create chat room');
      return null;
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    const roomName = selectedUsers.length === 1 
      ? users.find(u => u.id === selectedUsers[0])?.name || 'Direct Chat'
      : groupName || `Group Chat (${selectedUsers.length + 1})`;
    
    const roomType = selectedUsers.length === 1 ? 'direct' : 'group';

    // Create new chat room
    const roomId = await createChatRoom(selectedUsers, roomName, roomType);
    if (roomId) {
      setSelectedRoom(roomId);
      setMessages([]);
      
      // Refresh chat rooms
      const updatedRooms = await fetchChatRooms();
      setChatRooms(updatedRooms);
      
      toast.success('Chat created successfully');
    }
    
    setShowNewChatModal(false);
    setSelectedUsers([]);
    setGroupName('');
  };

  const selectedRoomData = chatRooms.find(room => room.id === selectedRoom);
  const filteredRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shareableContent = [
    {
      type: 'ai_insight',
      icon: Brain,
      title: 'AI Insight: Lead Scoring',
      description: 'Share AI-generated insights about lead quality and conversion probability',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      type: 'client_update',
      icon: User,
      title: 'Client Update: Johnson Corp',
      description: 'Share latest updates about client interactions and deal progress',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      type: 'journal_entry',
      icon: FileText,
      title: 'Journal Entry: Daily Reflection',
      description: 'Share insights from your daily journal and mood tracking',
      color: 'bg-green-100 text-green-600'
    },
    {
      type: 'calendar_event',
      icon: Calendar,
      title: 'Calendar Event: Team Meeting',
      description: 'Share upcoming meetings and calendar events with the team',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="page-container h-screen flex">
      {/* Sidebar */}
      <div className="w-80 card-container flex flex-col">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Live Chat</h1>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="btn-primary p-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => {
            const isSelected = selectedRoom === room.id;
            const participant = room.type === 'direct' 
              ? users.find(u => u.id === room.participants[0])
              : null;
            
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-pink-50 border-pink-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {room.type === 'direct' ? (
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant?.name.charAt(0) || 'U'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {room.type === 'direct' && participant?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {room.name}
                      </h3>
                      {room.unreadCount > 0 && (
                        <span className="badge-error text-xs">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {room.lastMessage.type === 'shared_content' 
                          ? `📎 ${room.lastMessage.sharedContent?.title}`
                          : room.lastMessage.content
                        }
                      </p>
                    )}
                    {room.type === 'direct' && participant && !participant.isOnline && participant.lastSeen && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last seen {participant.lastSeen.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    {selectedRoomData?.type === 'direct' ? (
                      <span className="text-white text-sm font-medium">
                        {selectedRoomData.name.charAt(0)}
                      </span>
                    ) : (
                      <Hash className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedRoomData?.name}
                    </h2>
                    {selectedRoomData?.type === 'group' && (
                      <p className="text-sm text-gray-500">
                        {selectedRoomData.participants.length + 1} members
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="btn-secondary p-2">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="btn-secondary p-2">
                    <Video className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="btn-secondary p-2"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="btn-secondary p-2">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.senderId === (user?.id || 'current-user');
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-500 mb-1 px-3">{msg.senderName}</p>
                      )}
                      
                      {msg.type === 'shared_content' ? (
                        <div className={`p-3 rounded-lg border ${
                          isOwn 
                            ? 'bg-pink-600 text-white border-pink-600' 
                            : 'bg-white text-gray-900 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Shared Content</span>
                          </div>
                          <h4 className="font-medium text-sm mb-1">
                            {msg.sharedContent?.title}
                          </h4>
                          <p className={`text-xs ${
                            isOwn ? 'text-pink-100' : 'text-gray-600'
                          }`}>
                            {msg.sharedContent?.description}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-lg ${
                          isOwn 
                            ? 'bg-pink-600 text-white' 
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1 px-3">
                        <p className="text-xs text-gray-400">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                        {isOwn && (
                          <div className="flex items-center space-x-1">
                            {msg.isRead ? (
                              <Eye className="w-3 h-3 text-gray-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2 px-3">
                          {msg.reactions.map((reaction, index) => (
                            <span key={index} className="badge-info text-xs">
                              {reaction.emoji} {reaction.users.length}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="card-footer">
              <div className="flex items-center space-x-3">
                <button className="btn-secondary p-2">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="input-primary w-full px-4 py-3"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="btn-primary p-3"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Share Content Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md mx-4">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">Share Content</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body space-y-3">
              {shareableContent.map((content) => (
                <button
                  key={content.type}
                  onClick={() => handleShareContent(
                    content.type,
                    content.title,
                    content.description,
                    {}
                  )}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${content.color}`}>
                      <content.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{content.title}</h4>
                      <p className="text-sm text-gray-500">{content.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md mx-4">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="btn-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body">
            {selectedUsers.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="input-primary w-full px-3 py-2"
                />
              </div>
            )}
            
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Users
              </label>
              {users.map((user) => (
                <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {user.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                  )}
                </label>
              ))}
            </div>
            </div>
            
            <div className="modal-footer flex space-x-3">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSelectedUsers([]);
                  setGroupName('');
                }}
                className="btn-secondary flex-1 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0}
                className="btn-primary flex-1 px-4 py-2"
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}