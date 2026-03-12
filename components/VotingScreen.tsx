import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import NotificationBanner from './NotificationBanner'

export default function VotingScreen({ room, playerId, socket, notification }: any) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [timer, setTimer] = useState(60)

  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const isAlive = currentPlayer?.isAlive
  const alivePlayers = room?.players?.filter((p: any) => p.isAlive) || []

  useEffect(() => {
    if (!socket) return
    socket.on('vote-update', (updatedVotes: Record<string, string>) => setVotes(updatedVotes))
    socket.on('phase-changed', () => { setVoteSubmitted(false); setSelectedTarget(null) })
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => { socket.off('vote-update'); socket.off('phase-changed'); clearInterval(interval) }
  }, [socket])

  const submitVote = () => {
    if (!selectedTarget || !socket || !isAlive) return
    socket.emit('cast-vote', { roomId: room.id, playerId, targetId: selectedTarget })
    setVoteSubmitted(true)
  }

  // Count votes per player
  const voteCounts: Record<string, number> = {}
  Object.values(votes).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  })
  const totalVotes = Object.keys(votes).length

  return (
    <View style={styles.container}>
      <NotificationBanner message={notification} />

      <View style={styles.header}>
        <Text style={styles.title}>⚖️ VOTING</Text>
        <Text style={[styles.timer, timer < 15 && { color: '#DC143C' }]}>
          {timer}s
        </Text>
      </View>

      <Text style={styles.subtitle}>VOTE TO ELIMINATE A SUSPECT</Text>
      <Text style={styles.voteCount}>{totalVotes} / {alivePlayers.length} VOTED</Text>

      <FlatList
        data={alivePlayers}
        keyExtractor={p => p.id}
        style={styles.list}
        renderItem={({ item }) => {
          const voteNum = voteCounts[item.id] || 0
          const isSelected = selectedTarget === item.id
          const votersForThis = Object.entries(votes).filter(([, t]) => t === item.id).map(([voterId]) => {
            const voter = room.players.find((p: any) => p.id === voterId)
            return voter?.name || '?'
          })

          return (
            <TouchableOpacity
              style={[styles.playerRow, isSelected && styles.playerRowSelected, item.id === playerId && styles.playerRowSelf]}
              onPress={() => !voteSubmitted && isAlive && item.id !== playerId && setSelectedTarget(item.id)}
              disabled={voteSubmitted || !isAlive || item.id === playerId}
            >
              <View style={[styles.avatar, { backgroundColor: item.color || '#e74c3c' }]}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name} {item.id === playerId && '(You)'}</Text>
                {votersForThis.length > 0 && (
                  <Text style={styles.voterNames}>Voted by: {votersForThis.join(', ')}</Text>
                )}
              </View>
              <View style={styles.voteBar}>
                {voteNum > 0 && (
                  <View style={[styles.voteBarFill, { width: `${(voteNum / alivePlayers.length) * 100}%` as any }]} />
                )}
                <Text style={styles.voteNum}>{voteNum} vote{voteNum !== 1 ? 's' : ''}</Text>
              </View>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )
        }}
      />

      {isAlive && (
        voteSubmitted ? (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedText}>✅ Vote cast! Waiting for others...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.voteBtn, !selectedTarget && styles.voteBtnDisabled]}
            onPress={submitVote}
            disabled={!selectedTarget}
          >
            <Text style={styles.voteBtnText}>⚖️ CAST VOTE</Text>
          </TouchableOpacity>
        )
      )}

      {!isAlive && (
        <View style={styles.spectatingBox}>
          <Text style={styles.spectatingText}>👻 Spectating the vote</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000a0a', padding: 16, paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, color: '#1E90FF', fontWeight: 'bold', letterSpacing: 4 },
  timer: { fontSize: 28, color: '#1E90FF', fontWeight: 'bold', fontFamily: 'monospace' },
  subtitle: { color: '#444', letterSpacing: 4, fontSize: 10, marginBottom: 4 },
  voteCount: { color: '#1E90FF88', fontSize: 12, letterSpacing: 2, marginBottom: 16 },
  list: { flex: 1 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#1E90FF22', backgroundColor: 'rgba(0,0,0,0.4)', marginBottom: 8 },
  playerRowSelected: { borderColor: '#1E90FF', backgroundColor: 'rgba(30,144,255,0.15)' },
  playerRowSelf: { opacity: 0.4 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  playerInfo: { flex: 1 },
  playerName: { color: 'white', fontSize: 16, fontWeight: '600' },
  voterNames: { color: '#1E90FF88', fontSize: 10, marginTop: 2 },
  voteBar: { width: 80, height: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  voteBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(30,144,255,0.3)', borderRadius: 12 },
  voteNum: { color: '#1E90FF', fontSize: 11, fontWeight: 'bold', zIndex: 1 },
  checkmark: { color: '#1E90FF', fontSize: 20, fontWeight: 'bold' },
  voteBtn: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1E90FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  voteBtnDisabled: { opacity: 0.3 },
  voteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
  submittedBox: { padding: 16, alignItems: 'center', backgroundColor: 'rgba(0,168,107,0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#00A86B44', marginTop: 8 },
  submittedText: { color: '#00A86B', fontSize: 14 },
  spectatingBox: { padding: 16, alignItems: 'center' },
  spectatingText: { color: '#444', fontSize: 14 },
})