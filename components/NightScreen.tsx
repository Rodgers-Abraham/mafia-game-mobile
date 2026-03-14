import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, FlatList } from 'react-native'
import NotificationBanner from './NotificationBanner'

const ROLE_INFO: Record<string, { emoji: string; color: string; action: string }> = {
  Mafia: { emoji: '🔫', color: '#DC143C', action: 'Choose someone to eliminate' },
  Godfather: { emoji: '👑', color: '#8B0000', action: 'Choose someone to eliminate' },
  Detective: { emoji: '🔍', color: '#1E90FF', action: 'Investigate a player' },
  Doctor: { emoji: '💊', color: '#00A86B', action: 'Protect someone tonight' },
  Bodyguard: { emoji: '🛡️', color: '#708090', action: 'Guard someone tonight' },
  Vigilante: { emoji: '⚡', color: '#FF6600', action: 'Eliminate a suspect' },
  RoleBlocker: { emoji: '🚫', color: '#800080', action: 'Block someone tonight' },
  Villager: { emoji: '👤', color: '#aaa', action: 'Wait for dawn...' },
  Jester: { emoji: '🤡', color: '#FFD700', action: 'Wait for dawn...' },
  Mayor: { emoji: '⭐', color: '#DAA520', action: 'Wait for dawn...' },
}

const MAFIA_ROLES = ['Mafia', 'Godfather']
const ACTION_ROLES = ['Mafia', 'Godfather', 'Detective', 'Doctor', 'Bodyguard', 'Vigilante', 'RoleBlocker']

export default function NightScreen({ room, playerId, socket, notification, mafiaTeammates = []}: any) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [actionSubmitted, setActionSubmitted] = useState(false)
  const [mafiaMessage, setMafiaMessage] = useState('')
  const [mafiaMessages, setMafiaMessages] = useState<any[]>([])
  const [timer, setTimer] = useState(90)
  const scrollRef = useRef<ScrollView>(null)

  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const role = currentPlayer?.role
  const roleInfo = ROLE_INFO[role] || { emoji: '👤', color: '#aaa', action: 'Wait for dawn...' }
  const isMafia = MAFIA_ROLES.includes(role)
  const canAct = ACTION_ROLES.includes(role)
  const alivePlayers = room?.players?.filter((p: any) => p.isAlive && p.id !== playerId) || []
  const phase = room?.phase

  useEffect(() => {
    if (!socket) return
    socket.on('mafia-chat-message', (msg: any) => {
      setMafiaMessages(prev => [...prev, msg])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    })
    socket.on('phase-changed', () => { setActionSubmitted(false); setSelectedTarget(null) })

    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => {
      socket.off('mafia-chat-message')
      socket.off('phase-changed')
      clearInterval(interval)
    }
  }, [socket])

  const submitAction = () => {
    if (!selectedTarget || !socket) return
    const actionMap: Record<string, string> = {
      Mafia: 'mafia-kill', Godfather: 'mafia-kill',
      Detective: 'investigate', Doctor: 'doctor-protect',
      Bodyguard: 'bodyguard-guard', Vigilante: 'vigilante-kill',
      RoleBlocker: 'block',
    }
    socket.emit('night-action', { roomId: room.id, playerId, action: actionMap[role], targetId: selectedTarget })
    setActionSubmitted(true)
  }

  const sendMafiaChat = () => {
    if (!mafiaMessage.trim() || !socket) return
    socket.emit('mafia-chat', { roomId: room.id, playerId, message: mafiaMessage.trim() })
    setMafiaMessage('')
  }

  const mins = Math.floor(timer / 60)
  const secs = timer % 60

  return (
    <View style={styles.container}>
      <NotificationBanner message={notification} />

      {/* Timer */}
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>NIGHT {room?.currentDay}</Text>
        <Text style={[styles.timer, timer < 20 && { color: '#DC143C' }]}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Role card */}
      <View style={[styles.roleCard, { borderColor: roleInfo.color + '66' }]}>
        <Text style={styles.roleEmoji}>{roleInfo.emoji}</Text>
        <Text style={[styles.roleName, { color: roleInfo.color }]}>{role}</Text>
        <Text style={styles.roleAction}>{roleInfo.action}</Text>
      </View>

      {/* Target selection */}
      {canAct && !actionSubmitted && phase === 'night' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>-- SELECT TARGET --</Text>
          <FlatList
            data={alivePlayers}
            keyExtractor={p => p.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.targetRow, selectedTarget === item.id && styles.targetSelected]}
                onPress={() => setSelectedTarget(item.id)}
              >
                <View style={[styles.targetAvatar, { backgroundColor: item.color || '#e74c3c' }]}>
                  <Text style={styles.targetAvatarText}>{item.name[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.targetName}>{item.name}</Text>
                {selectedTarget === item.id && <Text style={styles.selectedMark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={[styles.actionBtn, !selectedTarget && styles.actionBtnDisabled]}
            onPress={submitAction}
            disabled={!selectedTarget}
          >
            <Text style={styles.actionBtnText}>{roleInfo.emoji} CONFIRM ACTION</Text>
          </TouchableOpacity>
        </View>
      )}

      {actionSubmitted && (
        <View style={styles.submittedBox}>
          <Text style={styles.submittedText}>✅ Action submitted! Waiting for others...</Text>
        </View>
      )}

      {/* Mafia chat */}
      {isMafia && (
        <View style={styles.mafiaChat}>
          <Text style={styles.mafiaChatTitle}>🔫 MAFIA CHAT</Text>
          <View style={styles.teammatesRow}>
            {mafiaTeammates.map((t: any) => (
              <View key={t.id} style={styles.teammate}>
                <View style={[styles.teammateAvatar, { backgroundColor: t.color || '#DC143C' }]}>
                  <Text style={styles.teammateAvatarText}>{t.name[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.teammateName}>{t.name}</Text>
              </View>
            ))}
          </View>
          <ScrollView ref={scrollRef} style={styles.chatMessages}>
            {mafiaMessages.map((msg, i) => (
              <View key={i} style={styles.msgRow}>
                <View style={[styles.msgAvatar, { backgroundColor: msg.playerColor || '#DC143C' }]}>
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
              value={mafiaMessage}
              onChangeText={setMafiaMessage}
              placeholder="Mafia only..."
              placeholderTextColor="#3d0000"
              onSubmitEditing={sendMafiaChat}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMafiaChat}>
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === 'briefing' && (
        <View style={styles.briefingBox}>
          <Text style={styles.briefingText}>🌙 Night falls on the city...</Text>
          <Text style={styles.briefingSubText}>Remember your role and choose wisely</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05000f', padding: 16, paddingTop: 48 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timerLabel: { color: '#444', letterSpacing: 4, fontSize: 11 },
  timer: { color: '#9b59b6', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  roleCard: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  roleEmoji: { fontSize: 48, marginBottom: 8 },
  roleName: { fontSize: 24, fontWeight: 'bold', letterSpacing: 4, marginBottom: 4 },
  roleAction: { color: '#555', fontSize: 13, textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionTitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3d002033', marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  targetSelected: { borderColor: '#DC143C', backgroundColor: 'rgba(139,0,0,0.2)' },
  targetAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  targetAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  targetName: { flex: 1, color: 'white', fontSize: 16 },
  selectedMark: { color: '#DC143C', fontSize: 18, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  actionBtnDisabled: { opacity: 0.3 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15, letterSpacing: 2 },
  submittedBox: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,168,107,0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#00A86B44', marginBottom: 16 },
  submittedText: { color: '#00A86B', fontSize: 14, letterSpacing: 1 },
  mafiaChat: { flex: 1, backgroundColor: 'rgba(139,0,0,0.1)', borderWidth: 1, borderColor: '#8B000044', borderRadius: 16, padding: 12 },
  mafiaChatTitle: { color: '#DC143C', textAlign: 'center', letterSpacing: 4, fontSize: 11, marginBottom: 8 },
  teammatesRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  teammate: { alignItems: 'center', gap: 4 },
  teammateAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  teammateAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  teammateName: { color: '#DC143C', fontSize: 10 },
  chatMessages: { flex: 1, marginBottom: 8 },
  msgRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  msgAvatar: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  msgName: { color: '#666', fontSize: 9, letterSpacing: 1 },
  msgText: { color: '#ffaaaa', fontSize: 13 },
  chatInputRow: { flexDirection: 'row', gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#8B000066', borderRadius: 10, padding: 10, color: 'white', fontSize: 14 },
  sendBtn: { backgroundColor: '#8B0000', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  sendBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  briefingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  briefingText: { color: '#9b59b6', fontSize: 22, textAlign: 'center' },
  briefingSubText: { color: '#444', fontSize: 13, textAlign: 'center', letterSpacing: 2 },
})