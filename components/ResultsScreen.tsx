import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import NotificationBanner from './NotificationBanner'

const ROLE_COLORS: Record<string, string> = {
  Mafia: '#DC143C', Godfather: '#8B0000', Detective: '#1E90FF',
  Doctor: '#00A86B', Bodyguard: '#708090', Vigilante: '#FF6600',
  RoleBlocker: '#800080', Jester: '#FFD700', Mayor: '#DAA520', Villager: '#aaa',
}

export default function ResultsScreen({ room, playerId, socket, notification, lastResult }: any) {
  const [fadeAnim] = useState(new Animated.Value(0))
  const alivePlayers = room?.players?.filter((p: any) => p.isAlive) || []
  const deadPlayers = room?.players?.filter((p: any) => !p.isAlive) || []
  const mafiaCount = alivePlayers.filter((p: any) => ['Mafia', 'Godfather'].includes(p.role)).length
  const townCount = alivePlayers.filter((p: any) => !['Mafia', 'Godfather'].includes(p.role)).length

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start()
  }, [])

  return (
    <View style={styles.container}>
      <NotificationBanner message={notification} />

      <Text style={styles.title}>📋 RESULTS</Text>

      {lastResult ? (
        <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
          {lastResult.eliminatedPlayerId ? (
            <>
              <Text style={styles.eliminatedEmoji}>💀</Text>
              <Text style={styles.eliminatedName}>
                {room.players.find((p: any) => p.id === lastResult.eliminatedPlayerId)?.name || 'Unknown'}
              </Text>
              <Text style={styles.eliminatedRole}>was the</Text>
              <Text style={[styles.role, { color: ROLE_COLORS[lastResult.role] || '#aaa' }]}>
                {lastResult.role}
              </Text>
              <Text style={styles.cause}>
                {lastResult.cause === 'vote' ? '⚖️ Eliminated by vote' : '🔫 Killed in the night'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.noElimEmoji}>🤝</Text>
              <Text style={styles.noElimText}>No one was eliminated</Text>
              <Text style={styles.noElimSub}>The vote was tied</Text>
            </>
          )}
        </Animated.View>
      ) : (
        <View style={styles.noResultCard}>
          <Text style={styles.noResultText}>🌙 A peaceful night...</Text>
          <Text style={styles.noResultSub}>No one was killed</Text>
        </View>
      )}

      {/* Team balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>-- REMAINING --</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceNum, { color: '#DC143C' }]}>{mafiaCount}</Text>
            <Text style={styles.balanceLabel}>🔫 MAFIA</Text>
          </View>
          <Text style={styles.balanceVs}>VS</Text>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceNum, { color: '#00A86B' }]}>{townCount}</Text>
            <Text style={styles.balanceLabel}>👤 TOWN</Text>
          </View>
        </View>
      </View>

      {/* Player list */}
      <View style={styles.playerList}>
        <Text style={styles.playerListTitle}>-- ALIVE --</Text>
        <View style={styles.playerChips}>
          {alivePlayers.map((p: any) => (
            <View key={p.id} style={styles.playerChip}>
              <View style={[styles.chipAvatar, { backgroundColor: p.color || '#e74c3c' }]}>
                <Text style={styles.chipAvatarText}>{p.name[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.chipName}>{p.name}</Text>
            </View>
          ))}
        </View>
        {deadPlayers.length > 0 && (
          <>
            <Text style={[styles.playerListTitle, { marginTop: 12 }]}>-- ELIMINATED --</Text>
            <View style={styles.playerChips}>
              {deadPlayers.map((p: any) => (
                <View key={p.id} style={[styles.playerChip, styles.deadChip]}>
                  <Text style={styles.chipName}>💀 {p.name}</Text>
                  <Text style={[styles.chipRole, { color: ROLE_COLORS[p.role] || '#aaa' }]}>{p.role}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.nextPhaseBox}>
        <Text style={styles.nextPhaseText}>⏳ Next phase starting soon...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005', padding: 16, paddingTop: 48 },
  title: { fontSize: 28, color: '#DC143C', textAlign: 'center', fontWeight: 'bold', letterSpacing: 6, marginBottom: 20 },
  resultCard: { backgroundColor: 'rgba(139,0,0,0.15)', borderWidth: 1, borderColor: '#DC143C44', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  eliminatedEmoji: { fontSize: 56, marginBottom: 8 },
  eliminatedName: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  eliminatedRole: { color: '#555', fontSize: 13, marginBottom: 4 },
  role: { fontSize: 22, fontWeight: 'bold', letterSpacing: 3, marginBottom: 8 },
  cause: { color: '#666', fontSize: 12, letterSpacing: 2 },
  noElimEmoji: { fontSize: 48, marginBottom: 8 },
  noElimText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  noElimSub: { color: '#555', fontSize: 13, marginTop: 4 },
  noResultCard: { backgroundColor: 'rgba(0,168,107,0.1)', borderWidth: 1, borderColor: '#00A86B44', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  noResultText: { color: '#00A86B', fontSize: 20, fontWeight: 'bold' },
  noResultSub: { color: '#555', fontSize: 13, marginTop: 4 },
  balanceCard: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 16, marginBottom: 16 },
  balanceTitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  balanceItem: { alignItems: 'center' },
  balanceNum: { fontSize: 36, fontWeight: 'bold' },
  balanceLabel: { color: '#555', fontSize: 11, letterSpacing: 2 },
  balanceVs: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  playerList: { flex: 1 },
  playerListTitle: { color: '#333', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 8 },
  playerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  playerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  deadChip: { opacity: 0.5, flexDirection: 'column', alignItems: 'center', paddingVertical: 8 },
  chipAvatar: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  chipName: { color: 'white', fontSize: 12 },
  chipRole: { fontSize: 10, letterSpacing: 1, marginTop: 2 },
  nextPhaseBox: { padding: 16, alignItems: 'center' },
  nextPhaseText: { color: '#333', fontSize: 12, letterSpacing: 2 },
})