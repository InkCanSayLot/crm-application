/**
 * Chat API routes for live chat functionality
 * Handle chat rooms, messages, and real-time communication
 */
import { Router, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get all chat rooms for a user
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_participants!inner(
          user_id
        ),
        messages:chat_messages(
          id,
          content,
          sender_id,
          created_at,
          message_type,
          shared_content
        )
      `)
      .eq('chat_participants.user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Process rooms to include last message and unread count
    const processedRooms = await Promise.all(rooms.map(async (room) => {
      // Get last message
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('sender_id', userId)
        .eq('is_read', false)

      // Get participants info
      const { data: participants } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          users(
            id,
            email,
            full_name,
            avatar_url,
            is_online,
            last_seen
          )
        `)
        .eq('room_id', room.id)
        .neq('user_id', userId)

      return {
        ...room,
        lastMessage,
        unreadCount: unreadCount || 0,
        participants: participants?.map(p => p.users) || []
      }
    }))

    res.json(processedRooms)
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    res.status(500).json({ error: 'Failed to fetch chat rooms' })
  }
})

// Get messages for a specific room
router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.headers['user-id'] as string
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    // Verify user is participant in the room
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json(messages.reverse()) // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send a message
router.post('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.headers['user-id'] as string
    const { content, messageType = 'text', sharedContent } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    if (!content && !sharedContent) {
      return res.status(400).json({ error: 'Message content required' })
    }

    // Verify user is participant in the room
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        content,
        message_type: messageType,
        shared_content: sharedContent,
        is_read: false
      })
      .select(`
        *,
        sender:users(
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    // Update room's last activity
    await supabase
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', roomId)

    res.status(201).json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Create a new chat room
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string
    const { name, type = 'direct', participantIds } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Participants required' })
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        type,
        created_by: userId
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add participants (including creator)
    const allParticipants = [userId, ...participantIds]
    const participantInserts = allParticipants.map(participantId => ({
      room_id: room.id,
      user_id: participantId
    }))

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participantInserts)

    if (participantError) throw participantError

    res.status(201).json(room)
  } catch (error) {
    console.error('Error creating chat room:', error)
    res.status(500).json({ error: 'Failed to create chat room' })
  }
})

// Mark messages as read
router.put('/rooms/:roomId/messages/read', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.headers['user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' })
    }

    // Mark all messages in room as read for this user
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('sender_id', userId)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
})

// Get online users
router.get('/users/online', async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, is_online, last_seen')
      .eq('is_online', true)

    if (error) throw error

    res.json(users)
  } catch (error) {
    console.error('Error fetching online users:', error)
    res.status(500).json({ error: 'Failed to fetch online users' })
  }
})

// Get all users (for creating new chats)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string
    const search = req.query.search as string

    let query = supabase
      .from('users')
      .select('id, email, full_name, avatar_url, is_online, last_seen')
      .neq('id', userId) // Exclude current user

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query.limit(20)

    if (error) throw error

    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

export default router