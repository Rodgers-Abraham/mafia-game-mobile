import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList, Alert, Clipboard } from 'react-native'
import NotificationBanner from './NotificationBanner'

const MIN_PLAYERS = 4

export default function LobbyScreen({ room, playerId, socket, notification, onLeave }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>(room?.lobbyMessages || [])
  const scrollRef = useRef<ScrollView>(null)
  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const isHost = currentPlayer?.isHost

  useEffect(() => {
    if (!socket) return
    socket.on('lobby-chat-message', (msg: any) => {
      setMessages(prev => [...prev, msg])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    })
    socket.on('room-updated', (updatedRoom: any) => {
      if (updatedRoom.lobbyMessages) setMessages(updatedRoom.lobbyMessages)
    })
    return () => { socket.off('lobby-chat-message'); socket.off('room-updated') }
  }, [socket])

  const sendMessage = () => {
    if (!message.trim() || !socket) return
    socket.emit('lobby-chat', { roomId: room.id, playerId, message: message.trim() })
    setMessage('')
  }

  const startGame = () => {
    if (room.players.length < MIN_PLAYERS) {
      Alert.alert('Not enough players', `Need at least ${MIN_PLAYERS} players to start.`)
      return
    }
    socket?.emit('start-game', { roomId: room.id, playerId })
  }

  const copyCode = () => {
    Clipboard.setString(room.id)
    Alert.alert('Copied!', `Room code ${room.id} copied to clipboard`)
  }

  return (
    <View style={styles.container}>
      <NotificationBanner message={notification} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onLeave}>
          <Text style={styles.leaveBtn}>← LEAVE</Text>
        </TouchableOpacity>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <TouchableOpacity onPress={copyCode}>
            <Text style={styles.code}>{room.id} 📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>💀 LOBBY</Text>
      <Text style={styles.subtitle}>{room.players.length} / 20 PLAYERS</Text>

      {/* Players */}
      <View style={styles.playersCard}>
        <Text style={styles.sectionTitle}>-- PLAYERS --</Text>
        <FlatList
          data={room.players}
          keyExtractor={p => p.id}
          numColumns={2}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.playerChip}>
              <View style={[styles.playerAvatar, { backgroundColor: item.color || '#e74c3c' }]}>
                <Text style={styles.playerAvatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
                {item.isHost && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
            </View>
          )}
        />
      </View>

      {/* Chat */}
      <View style={styles.chatCard}>
        <Text style={styles.sectionTitle}>-- LOBBY CHAT --</Text>
        <ScrollView ref={scrollRef} style={styles.chatMessages} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          {messages.length === 0 && <Text style={styles.noMessages}>No messages yet...</Text>}
          {messages.map((msg, i) => (
            <View key={i} style={styles.msgRow}>
              <View style={[styles.msgAvatar, { backgroundColor: msg.playerColor || '#e74c3c' }]}>
                <Text style={styles.msgAvatarText}>{msg.playerName[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.msgName}>{msg.playerName}</Text>
                <Text style={styles.msgText}>{msg.message}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Say something..."
            placeholderTextColor="#333"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Start button */}
      {isHost && (
        <TouchableOpacity
          style={[styles.startBtn, room.players.length < MIN_PLAYERS && styles.startBtnDisabled]}
          onPress={startGame}
        >
          <Text style={styles.startBtnText}>
            {room.players.length < MIN_PLAYERS ? `NEED ${MIN_PLAYERS - room.players.length} MORE PLAYERS` : '🔫 START GAME'}
          </Text>
        </TouchableOpacity>
      )}
      {!isHost && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>⏳ Waiting for host to start...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005', padding: 16, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leaveBtn: { color: '#555', letterSpacing: 2, fontSize: 13 },
  codeBox: { alignItems: 'flex-end' },
  codeLabel: { color: '#444', fontSize: 9, letterSpacing: 3 },
  code: { color: '#FFD700', fontSize: 16, fontFamily: 'monospace', letterSpacing: 4, fontWeight: 'bold' },
  title: { fontSize: 32, color: '#DC143C', textAlign: 'center', fontWeight: 'bold', letterSpacing: 6 },
  subtitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 11, marginBottom: 16 },
  playersCard: { backgroundColor: 'rgba(139,0,0,0.08)', borderWidth: 1, borderColor: '#8B000033', borderRadius: 16, padding: 12, marginBottom: 12 },
  sectionTitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 12 },
  playerChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, margin: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10 },
  playerAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  playerName: { color: 'white', fontSize: 13, fontWeight: '600', maxWidth: 80 },
  hostBadge: { color: '#FFD700', fontSize: 9, letterSpacing: 2 },
  chatCard: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: '#3d002033', borderRadius: 16, padding: 12, marginBottom: 12 },
  chatMessages: { flex: 1, marginBottom: 8 },
  noMessages: { color: '#333', textAlign: 'center', marginTop: 20, fontSize: 13 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  msgAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  msgName: { color: '#888', fontSize: 10, letterSpacing: 1 },
  msgText: { color: 'white', fontSize: 14 },
  chatInputRow: { flexDirection: 'row', gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#3d002066', borderRadius: 10, padding: 10, color: 'white', fontSize: 14 },
  sendBtn: { backgroundColor: '#8B0000', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtnDisabled: { opacity: 0.4 },
  startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
  waitingBox: { padding: 16, alignItems: 'center' },
  waitingText: { color: '#555', letterSpacing: 2, fontSize: 13 },
})