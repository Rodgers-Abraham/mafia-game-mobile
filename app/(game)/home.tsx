import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface Profile { username: string; avatar_color: string }
interface Stats {
  games_played: number; games_won: number; games_lost: number
  wins_as_mafia: number; wins_as_town: number; wins_as_jester: number
  times_survived: number; times_eliminated: number
  times_mafia: number; times_detective: number; times_doctor: number
  times_villager: number; times_jester: number
}

export default function Home() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profileData }, { data: statsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('stats').select('*').eq('user_id', user.id).single(),
    ])
    if (profileData) setProfile(profileData)
    if (statsData) setStats(statsData)
  }

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut() } },
    ])
  }

  const winRate = stats && stats.games_played > 0 ? Math.round((stats.games_won / stats.games_played) * 100) : 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: profile?.avatar_color || '#e74c3c' }]}>
            <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View>
            <Text style={styles.username}>{profile?.username || 'Player'}</Text>
            <Text style={styles.headerSub}>WELCOME BACK</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>💀 MAFIA 💀</Text>
      <Text style={styles.titleSub}>-- THE CITY NEVER SLEEPS --</Text>

      {/* Action buttons */}
      <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(game)/create-room')}>
        <Text style={styles.primaryBtnEmoji}>🔫</Text>
        <View>
          <Text style={styles.primaryBtnText}>CREATE ROOM</Text>
          <Text style={styles.primaryBtnSub}>Become the host</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(game)/join-room')}>
        <Text style={styles.secondaryBtnEmoji}>🚪</Text>
        <View>
          <Text style={styles.secondaryBtnText}>JOIN ROOM</Text>
          <Text style={styles.secondaryBtnSub}>Enter a room code</Text>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>-- YOUR STATS --</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.games_played}</Text>
              <Text style={styles.statLabel}>GAMES</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#00A86B' }]}>{stats.games_won}</Text>
              <Text style={styles.statLabel}>WINS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#DC143C' }]}>{stats.games_lost}</Text>
              <Text style={styles.statLabel}>LOSSES</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#FFD700' }]}>{winRate}%</Text>
              <Text style={styles.statLabel}>WIN RATE</Text>
            </View>
          </View>

          <Text style={styles.roleStatsTitle}>ROLE WINS</Text>
          <View style={styles.roleRow}>
            <View style={styles.roleBox}>
              <Text style={styles.roleEmoji}>🔫</Text>
              <Text style={[styles.roleNum, { color: '#DC143C' }]}>{stats.wins_as_mafia}</Text>
              <Text style={styles.roleLabel}>Mafia</Text>
            </View>
            <View style={styles.roleBox}>
              <Text style={styles.roleEmoji}>⚖️</Text>
              <Text style={[styles.roleNum, { color: '#00A86B' }]}>{stats.wins_as_town}</Text>
              <Text style={styles.roleLabel}>Town</Text>
            </View>
            <View style={styles.roleBox}>
              <Text style={styles.roleEmoji}>🤡</Text>
              <Text style={[styles.roleNum, { color: '#FFD700' }]}>{stats.wins_as_jester}</Text>
              <Text style={styles.roleLabel}>Jester</Text>
            </View>
          </View>
        </View>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 48 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  username: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  headerSub: { color: '#444', fontSize: 10, letterSpacing: 3 },
  signOutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#3d0020', borderRadius: 8 },
  signOutText: { color: '#666', fontSize: 12, letterSpacing: 2 },
  title: { fontSize: 48, color: '#DC143C', textAlign: 'center', fontWeight: 'bold', letterSpacing: 6, textShadowColor: '#DC143C', textShadowRadius: 20 },
  titleSub: { color: '#333', textAlign: 'center', letterSpacing: 4, marginBottom: 40, fontSize: 11 },
  primaryBtn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, shadowColor: '#DC143C', shadowRadius: 10, shadowOpacity: 0.3, elevation: 5 },
  primaryBtnEmoji: { fontSize: 36 },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
  primaryBtnSub: { color: '#ffffff88', fontSize: 12, marginTop: 2 },
  secondaryBtn: { backgroundColor: 'rgba(52,152,219,0.15)', borderWidth: 1, borderColor: '#3498db66', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  secondaryBtnEmoji: { fontSize: 36 },
  secondaryBtnText: { color: '#3498db', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
  secondaryBtnSub: { color: '#3498db88', fontSize: 12, marginTop: 2 },
  statsCard: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#3d002044', borderRadius: 20, padding: 20 },
  statsTitle: { color: '#444', textAlign: 'center', letterSpacing: 4, fontSize: 11, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  statLabel: { color: '#444', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  roleStatsTitle: { color: '#333', textAlign: 'center', letterSpacing: 3, fontSize: 10, marginBottom: 12 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-around' },
  roleBox: { alignItems: 'center', gap: 4 },
  roleEmoji: { fontSize: 24 },
  roleNum: { fontSize: 20, fontWeight: 'bold' },
  roleLabel: { color: '#444', fontSize: 10, letterSpacing: 2 },
})