import { View, Text, StyleSheet, ScrollView } from 'react-native'
import NotificationBanner from './NotificationBanner'

const ROLE_COLORS: Record<string, string> = {
  Mafia: '#DC143C', Godfather: '#8B0000', Detective: '#1E90FF',
  Doctor: '#00A86B', Bodyguard: '#708090', Vigilante: '#FF6600',
  RoleBlocker: '#800080', Jester: '#FFD700', Mayor: '#DAA520', Villager: '#aaa',
}

const PHASE_LABELS: Record<string, string> = {
  night: '🌙 NIGHT PHASE', day: '☀️ DAY PHASE',
  voting: '⚖️ VOTING PHASE', results: '📋 RESULTS', briefing: '📜 BRIEFING',
}

export default function SpectatorScreen({ room, playerId, notification }: any) {
  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const alivePlayers = room?.players?.filter((p: any) => p.isAlive) || []
  const deadPlayers = room?.players?.filter((p: any) => !p.isAlive) || []
  const mafiaCount = alivePlayers.filter((p: any) => ['Mafia', 'Godfather'].includes(p.role)).length
  const townCount = alivePlayers.filter((p: any) => !['Mafia', 'Godfather'].includes(p.role)).length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <NotificationBanner message={notification} />

      {/* Spectator banner */}
      <View style={styles.spectatorBanner}>
        <Text style={styles.spectatorEmoji}>👻</Text>
        <Text style={styles.spectatorTitle}>SPECTATING</Text>
        <Text style={styles.spectatorSub}>You have been eliminated</Text>
      </View>

      {/* Current phase */}
      <View style={styles.phaseCard}>
        <Text style={styles.phaseText}>{PHASE_LABELS[room?.phase] || room?.phase?.toUpperCase()}</Text>
        <Text style={styles.dayText}>Day {room?.currentDay}</Text>
      </View>

      {/* Your role */}
      {currentPlayer && (
        <View style={[styles.roleCard, { borderColor: ROLE_COLORS[currentPlayer.role] + '66' || '#aaa66' }]}>
          <Text style={styles.roleCardLabel}>YOUR ROLE WAS</Text>
          <Text style={[styles.roleCardRole, { color: ROLE_COLORS[currentPlayer.role] || '#aaa' }]}>
            {currentPlayer.role}
          </Text>
        </View>
      )}

      {/* Team balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.sectionTitle}>-- TEAM BALANCE --</Text>
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

      {/* All roles (spectators can see everyone) */}
      <View style={styles.rolesCard}>
        <Text style={styles.sectionTitle}>-- ALL PLAYERS --</Text>
        {alivePlayers.map((p: any) => (
          <View key={p.id} style={styles.playerRow}>
            <View style={[styles.avatar, { backgroundColor: p.color || '#e74c3c' }]}>
              <Text style={styles.avatarText}>{p.name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={[styles.playerRole, { color: ROLE_COLORS[p.role] || '#aaa' }]}>{p.role}</Text>
            <View style={styles.aliveDot} />
          </View>
        ))}

        {deadPlayers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>-- ELIMINATED --</Text>
            {deadPlayers.map((p: any) => (
              <View key={p.id} style={[styles.playerRow, styles.deadRow]}>
                <View style={[styles.avatar, { backgroundColor: p.color || '#e74c3c', opacity: 0.4 }]}>
                  <Text style={styles.avatarText}>{p.name[0].toUpperCase()}</Text>
                </View>
                <Text style={[styles.playerName, { opacity: 0.4 }]}>{p.name}</Text>
                <Text style={[styles.playerRole, { color: ROLE_COLORS[p.role] || '#aaa', opacity: 0.6 }]}>{p.role}</Text>
                <Text style={styles.deadEmoji}>💀</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05050f' },
  scroll: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  spectatorBanner: { backgroundColor: 'rgba(100,100,100,0.15)', borderWidth: 1, borderColor: '#ffffff22', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  spectatorEmoji: { fontSize: 48, marginBottom: 8 },
  spectatorTitle: { color: '#888', fontSize: 24, fontWeight: 'bold', letterSpacing: 6, marginBottom: 4 },
  spectatorSub: { color: '#444', fontSize: 12, letterSpacing: 2 },
  phaseCard: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  phaseText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 },
  dayText: { color: '#555', fontSize: 11, letterSpacing: 3, marginTop: 4 },
  roleCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  roleCardLabel: { color: '#444', fontSize: 10, letterSpacing: 3, marginBottom: 6 },
  roleCardRole: { fontSize: 22, fontWeight: 'bold', letterSpacing: 4 },
  balanceCard: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { color: '#333', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  balanceItem: { alignItems: 'center' },
  balanceNum: { fontSize: 32, fontWeight: 'bold' },
  balanceLabel: { color: '#444', fontSize: 11, letterSpacing: 2 },
  balanceVs: { color: '#333', fontSize: 14, fontWeight: 'bold' },
  rolesCard: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: '#ffffff08', borderRadius: 16, padding: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ffffff06' },
  deadRow: {},
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  playerName: { flex: 1, color: 'white', fontSize: 14 },
  playerRole: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  aliveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00A86B' },
  deadEmoji: { fontSize: 14 },
})