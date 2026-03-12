import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client'
import { supabase } from '@/lib/supabase'

const COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722','#8bc34a','#607d8b']
const SERVER_URL = 'https://mafia-game-shl9.onrender.com'

export default function JoinRoom() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[2])
  const [takenColors, setTakenColors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('username, avatar_color').eq('id', user.id).single()
    if (data) { setPlayerName(data.username); setSelectedColor(data.avatar_color || COLORS[2]) }
  }

  const fetchTakenColors = (code: string) => {
    if (code.length < 6) { setTakenColors([]); return }
    const socket = io(SERVER_URL)
    socket.on('connect', () => {
      socket.emit('get-available-colors', { roomId: code.toUpperCase() }, (response: any) => {
        const used = COLORS.filter(c => !response.colors.includes(c))
        setTakenColors(used)
        if (used.includes(selectedColor)) {
          const first = response.colors[0]
          if (first) setSelectedColor(first)
        }
        socket.disconnect()
      })
    })
  }

  const handleJoin = () => {
    if (!playerName.trim()) { Alert.alert('Error', 'Please enter your name'); return }
    if (!roomCode.trim()) { Alert.alert('Error', 'Please enter a room code'); return }
    setLoading(true)
    const socket = io(SERVER_URL)
    socket.on('connect', () => {
      socket.emit('join-room', { roomId: roomCode.trim().toUpperCase(), playerName: playerName.trim(), color: selectedColor }, async (response: any) => {
        if (response.success) {
          await AsyncStorage.setItem('roomData', JSON.stringify({ playerId: response.playerId, roomId: response.room.id }))
          await AsyncStorage.setItem('isHost', 'false')
          socket.disconnect()
          router.push(`/(game)/room/${response.room.id}`)
        } else {
          Alert.alert('Error', response.error || 'Failed to join room')
          setLoading(false)
          socket.disconnect()
        }
      })
    })
    socket.on('connect_error', () => { Alert.alert('Error', 'Could not connect to server'); setLoading(false) })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <Text style={styles.emoji}>🚪</Text>
      <Text style={styles.title}>JOIN ROOM</Text>
      <Text style={styles.subtitle}>-- ENTER IF YOU DARE --</Text>

      <View style={styles.card}>
        <Text style={styles.label}>ROOM CODE</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={roomCode}
          onChangeText={text => { setRoomCode(text.toUpperCase()); fetchTakenColors(text) }}
          placeholder="XXXXXX"
          placeholderTextColor="#333"
          maxLength={6}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>YOUR NAME</Text>
        <TextInput style={styles.input} value={playerName} onChangeText={setPlayerName} placeholder="Enter your name..." placeholderTextColor="#444" maxLength={20} />

        <Text style={styles.label}>CHOOSE YOUR COLOR {takenColors.length > 0 && <Text style={{ color: '#444' }}>(greyed = taken)</Text>}</Text>
        <View style={styles.colorGrid}>
          {COLORS.map(color => {
            const taken = takenColors.includes(color)
            return (
              <TouchableOpacity
                key={color}
                onPress={() => !taken && setSelectedColor(color)}
                disabled={taken}
                style={[styles.colorDot, { backgroundColor: color, opacity: taken ? 0.2 : 1 }, selectedColor === color && !taken && styles.colorSelected]}
              />
            )
          })}
        </View>

        <View style={styles.preview}>
          <View style={[styles.avatar, { backgroundColor: selectedColor }]}>
            <Text style={styles.avatarText}>{playerName ? playerName[0].toUpperCase() : '?'}</Text>
          </View>
          <Text style={styles.previewName}>{playerName || 'Your Name'}</Text>
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleJoin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '⏳ JOINING...' : '🚪 JOIN ROOM'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005' },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { marginTop: 48, marginBottom: 24 },
  backText: { color: '#555', letterSpacing: 2, fontSize: 13 },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 36, color: '#3498db', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 },
  subtitle: { color: '#444', textAlign: 'center', letterSpacing: 4, marginBottom: 32, fontSize: 11 },
  card: { backgroundColor: 'rgba(52,152,219,0.08)', borderWidth: 1, borderColor: '#3498db33', borderRadius: 20, padding: 24 },
  label: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#3d002066', borderRadius: 12, padding: 14, color: 'white', fontSize: 16 },
  codeInput: { textAlign: 'center', fontSize: 28, fontFamily: 'monospace', letterSpacing: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: 'white', transform: [{ scale: 1.2 }] },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  previewName: { color: 'white', fontSize: 16, fontWeight: '600' },
  btn: { backgroundColor: '#1a4a6b', borderWidth: 1, borderColor: '#3498db', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
})