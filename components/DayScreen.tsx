import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList } from 'react-native'
import NotificationBanner from './NotificationBanner'

export default function DayScreen({ room, playerId, socket, notification }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [timer, setTimer] = useState(120)
  const scrollRef = useRef<ScrollView>(null)
  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const isAlive = currentPlayer?.isAlive
  const alivePlayers = room?.players?.filter((p: any) => p.isAlive) || []
  const deadPlayers = room?.players?.filter((p: any) => !p.isAlive) || []

  useEffect(() => {
    if (!socket) return
    socket.on('chat-message', (msg: any) => {
      setMessages(prev => [...prev, msg])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    })
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => { socket.off('chat-message'); clearInterval(interval) }
  }, [socket])

  const sendMessage = () => {
    if (!message.trim() || !socket || !isAlive) return
    socket.emit('chat-message', { roomId: room.id, playerId, message: message.trim() })
    setMessage('')
  }

  const mins = Math.floor(timer / 60)
  const secs = timer % 60

  return (
    <View style={styles.container}>
      <NotificationBanner message={notification} />

      <View style={styles.header}>
        <Text style={styles.dayLabel}>☀️ DAY {room?.currentDay}</Text>
        <Text style={[styles.timer, timer < 30 && { color: '#DC143C' }]}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
      </View>

      <Text style={styles.subtitle}>DISCUSS AND FIND THE MAFIA</Text>

      {/* Alive players */}
      <View style={styles.playersRow}>
        {alivePlayers.map((p: any) => (
          <View key={p.id} style={styles.playerChip}>
            <View style={[styles.playerAvatar, { backgroundColor: p.color || '#e74c3c' }]}>
              <Text style={styles.playerAvatarText}>{p.name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
          </View>
        ))}
      </View>

      {deadPlayers.length > 0 && (
        <View style={styles.deadRow}>
          <Text style={styles.deadLabel}>ELIMINATED: </Text>
          {deadPlayers.map((p: any) => (
            <Text key={p.id} style={styles.deadName}>💀{p.name} </Text>
          ))}
        </View>
      )}

      {/* Chat */}
      <View style={styles.chatCard}>
        <Text style={styles.chatTitle}>-- TOWN DISCUSSION --</Text>
        <ScrollView ref={scrollRef} style={styles.chatMessages} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          {messages.length === 0 && <Text style={styles.noMessages}>No messages yet... speak up!</Text>}
          {messages.map((msg, i) => (
            <View key={i} style={[styles.msgRow, msg.playerId === playerId && styles.myMsgRow]}>
              <View style={[styles.msgAvatar, { backgroundColor: msg.playerColor || '#e74c3c' }]}>
                <Text style={styles.msgAvatarText}>{msg.playerName[0].toUpperCase()}</Text>
              </View>
              <View style={styles.msgBubble}>
                <Text style={styles.msgName}>{msg.playerName}</Text>
                <Text style={styles.msgText}>{msg.message}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        {isAlive ? (
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Speak to the town..."
              placeholderTextColor="#333"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.deadNotice}>
            <Text style={styles.deadNoticeText}>💀 You are eliminated — spectating only</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0500', padding: 16, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayLabel: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', letterSpacing: 4 },
  timer: { color: '#FFD700', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  subtitle: { color: '#444', letterSpacing: 4, fontSize: 10, marginBottom: 12 },
  playersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  playerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: '#FFD70033', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  playerAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  playerName: { color: 'white', fontSize: 12, maxWidth: 70 },
  deadRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 },
  deadLabel: { color: '#444', fontSize: 11, letterSpacing: 2 },
  deadName: { color: '#555', fontSize: 11 },
  chatCard: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: '#FFD70022', borderRadius: 16, padding: 12 },
  chatTitle: { color: '#555', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 8 },
  chatMessages: { flex: 1, marginBottom: 8 },
  noMessages: { color: '#333', textAlign: 'center', marginTop: 20, fontSize: 13 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  myMsgRow: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  msgAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  msgBubble: { maxWidth: '75%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 8 },
  msgName: { color: '#666', fontSize: 9, letterSpacing: 1, marginBottom: 2 },
  msgText: { color: 'white', fontSize: 14 },
  chatInputRow: { flexDirection: 'row', gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#FFD70033', borderRadius: 10, padding: 10, color: 'white', fontSize: 14 },
  sendBtn: { backgroundColor: '#7a6000', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  sendBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  deadNotice: { padding: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10 },
  deadNoticeText: { color: '#444', fontSize: 12 },
})