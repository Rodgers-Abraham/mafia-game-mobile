import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import NotificationBanner from './NotificationBanner'

const ROLE_COLORS: Record<string, string> = {
  Mafia: '#DC143C', Godfather: '#8B0000', Detective: '#1E90FF',
  Doctor: '#00A86B', Bodyguard: '#708090', Vigilante: '#FF6600',
  RoleBlocker: '#800080', Jester: '#FFD700', Mayor: '#DAA520', Villager: '#aaa',
}

const MAFIA_ROLES = ['Mafia', 'Godfather']

export default function GameEndedScreen({ room, playerId, socket, notification, onLeave }: any) {
  const router = useRouter()
  const [statsSaved, setStatsSaved] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const winner = room?.winningTeam || 'town'

  const playerWon = () => {
    if (winner === 'jester') return currentPlayer?.role === 'Jester'
    if (winner === 'mafia') return MAFIA_ROLES.includes(currentPlayer?.role)
    return !MAFIA_ROLES.includes(currentPlayer?.role) && currentPlayer?.role !== 'Jester'
  }

  const won = playerWon()

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start()
    saveStats()
  }, [])

  const saveStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: stats } = await supabase.from('stats').select('*').eq('user_id', user.id).single()
      if (!stats) return

      const role = currentPlayer?.role || 'Villager'
      const survived = currentPlayer?.isAlive || false
      const roleKey = `times_${role.toLowerCase()}` as keyof typeof stats
      const winKey = won ? `wins_as_${winner === 'mafia' ? 'mafia' : winner === 'jester' ? 'jester' : 'town'}` : null

      const updates: Record<string, number> = {
        games_played: (stats.games_played || 0) + 1,
        games_won: (stats.games_won || 0) + (won ? 1 : 0),
        games_lost: (stats.games_lost || 0) + (won ? 0 : 1),
        times_survived: (stats.times_survived || 0) + (survived ? 1 : 0),
        times_eliminated: (stats.times_eliminated || 0) + (survived ? 0 : 1),
        [roleKey]: ((stats[roleKey] as number) || 0) + 1,
      }

      if (winKey) updates[winKey] = ((stats[winKey as keyof typeof stats] as number) || 0) + 1

      await supabase.from('stats').update(updates).eq('user_id', user.id)
      setStatsSaved(true)
    } catch (e) {
      console.log('Stats save error:', e)
    }
  }

  const winnerConfig = {
    mafia: { emoji: '🔫', color: '#DC143C', title: 'MAFIA WINS', sub: 'The city falls to darkness' },
    town: { emoji: '⚖️', color: '#00A86B', title: 'TOWN WINS', sub: 'Justice has been served' },
    jester: { emoji: '🤡', color: '#FFD700', title: 'JESTER WINS', sub: 'The fool had the last laugh' },
  }[winner] || { emoji: '💀', color: '#aaa', title: 'GAME OVER', sub: '' }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <NotificationBanner message={notification} />

      <Animated.View style={[styles.resultBanner, { borderColor: winnerConfig.color + '66', opacity: fadeAnim }]}>
        <Text style={styles.resultEmoji}>{winnerConfig.emoji}</Text>
        <Text style={[styles.resultTitle, { color: winnerConfig.color }]}>{winnerConfig.title}</Text>
        <Text style={styles.resultSub}>{winnerConfig.sub}</Text>
      </Animated.View>

      {/* Personal result */}
      <View style={[styles.personalCard, { borderColor: won ? '#00A86B66' : '#DC143C66' }]}>
        <Text style={styles.personalEmoji}>{won ? '🏆' : '💀'}</Text>
        <Text style={[styles.personalResult, { color: won ? '#00A86B' : '#DC143C' }]}>
          {won ? 'YOU WIN!' : 'YOU LOSE'}
        </Text>
        <View style={[styles.roleTag, { borderColor: ROLE_COLORS[currentPlayer?.role] + '66' || '#aaa66' }]}>
          <Text style={[styles.roleTagText, { color: ROLE_COLORS[currentPlayer?.role] || '#aaa' }]}>
            {currentPlayer?.role}
          </Text>
        </View>
        {statsSaved && <Text style={styles.statsSavedText}>✅ Stats saved!</Text>}
      </View>

      {/* All roles revealed */}
      <View style={styles.rolesCard}>
        <Text style={styles.rolesTitle}>-- ALL ROLES REVEALED --</Text>
        {room?.players?.map((p: any) => (
          <View key={p.id} style={styles.playerRow}>
            <View style={[styles.avatar, { backgroundColor: p.color || '#e74c3c' }]}>
              <Text style={styles.avatarText}>{p.name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.playerName}>{p.name} {p.id === playerId && '(You)'}</Text>
            <Text style={[styles.playerRole, { color: ROLE_COLORS[p.role] || '#aaa' }]}>{p.role}</Text>
            {!p.isAlive && <Text style={styles.deadMark}>💀</Text>}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.homeBtn} onPress={onLeave}>
        <Text style={styles.homeBtnText}>🏠 BACK TO HOME</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005' },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  resultBanner: { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  resultEmoji: { fontSize: 72, marginBottom: 12 },
  resultTitle: { fontSize: 36, fontWeight: 'bold', letterSpacing: 6, marginBottom: 8 },
  resultSub: { color: '#555', fontSize: 13, letterSpacing: 2, textAlign: 'center' },
  personalCard: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  personalEmoji: { fontSize: 48, marginBottom: 8 },
  personalResult: { fontSize: 28, fontWeight: 'bold', letterSpacing: 4, marginBottom: 12 },
  roleTag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 8 },
  roleTagText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  statsSavedText: { color: '#00A86B', fontSize: 12, letterSpacing: 2, marginTop: 4 },
  rolesCard: { backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: '#3d002033', borderRadius: 20, padding: 16, marginBottom: 20 },
  rolesTitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 10, marginBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  playerName: { flex: 1, color: 'white', fontSize: 15 },
  playerRole: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  deadMark: { fontSize: 14 },
  homeBtn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 14, padding: 18, alignItems: 'center' },
  homeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
})