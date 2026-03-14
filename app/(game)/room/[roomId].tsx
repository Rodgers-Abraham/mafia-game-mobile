import { useEffect, useRef, useState } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io, Socket } from 'socket.io-client'

import LobbyScreen from '@/components/LobbyScreen'
import NightScreen from '@/components/NightScreen'
import DayScreen from '@/components/DayScreen'
import VotingScreen from '@/components/VotingScreen'
import ResultsScreen from '@/components/ResultsScreen'
import GameEndedScreen from '@/components/GameEndedScreen'
import SpectatorScreen from '@/components/SpectatorScreen'

const SERVER_URL = 'https://mafia-game-shl9.onrender.com'

export default function RoomPage() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>()
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>('lobby')
  const [mafiaTeammates, setMafiaTeammates] = useState<any[]>([])
  const [lastResult, setLastResult] = useState<any>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    initSocket()
    return () => { socketRef.current?.disconnect() }
  }, [])

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  const initSocket = async () => {
    const stored = await AsyncStorage.getItem('roomData')
    if (!stored) { router.replace('/(game)/home'); return }
    const { playerId: pid, roomId: rid, room: cachedRoom } = JSON.parse(stored)
    setPlayerId(pid)

    // Use cached room immediately so screen shows right away
    if (cachedRoom) {
      setRoom(cachedRoom)
      setPhase(cachedRoom.phase)
    }

    const socket = io(SERVER_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('rejoin-room', { roomId: rid, playerId: pid }, (res: any) => {
        if (res?.success && res?.room) {
          setRoom(res.room)
          setPhase(res.room.phase)
        }
      })
    })

    socket.on('room-updated', (data: any) => {
      const updatedRoom = data.room || data
      setRoom(updatedRoom)
      setPhase(updatedRoom.phase)
    })

    socket.on('game-started', (data: any) => {
      const updatedRoom = data.room || data
      setRoom(updatedRoom)
      setPhase('briefing')
    })

    socket.on('phase-changed', ({ phase: newPhase, room: updatedRoom }: any) => {
      setPhase(newPhase)
      if (updatedRoom) setRoom(updatedRoom)
    })

    socket.on('mafia-team', (teammates: any[]) => setMafiaTeammates(teammates))
    socket.on('night-result', (result: any) => setLastResult(result))
    socket.on('vote-result', (result: any) => setLastResult(result))
    socket.on('player-disconnected', ({ playerName, gracePeriod }: any) => showNotification(`⚠️ ${playerName} disconnected (${gracePeriod}s)`))
    socket.on('player-reconnected', ({ playerName }: any) => showNotification(`✅ ${playerName} reconnected`))
    socket.on('player-kicked', ({ playerName }: any) => showNotification(`❌ ${playerName} was removed`))
    socket.on('player-joined', ({ playerName }: any) => showNotification(`👤 ${playerName} joined`))
    socket.on('player-left', ({ playerName }: any) => showNotification(`👤 ${playerName} left`))
  }

  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const isSpectating = currentPlayer && !currentPlayer.isAlive && phase !== 'ended' && phase !== 'lobby'

  const commonProps = {
    room, playerId, socket: socketRef.current, notification,
    onLeave: async () => {
      socketRef.current?.emit('leave-room', { roomId: room?.id, playerId })
      await AsyncStorage.removeItem('roomData')
      router.replace('/(game)/home')
    },
  }

  if (!room || !playerId) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#DC143C" size="large" />
        <Text style={styles.loadingText}>Connecting...</Text>
        <Text style={styles.loadingSubText}>(Server may take 30s to wake up)</Text>
      </View>
    )
  }

  if (isSpectating) return <SpectatorScreen {...commonProps} />

  switch (phase) {
    case 'lobby': return <LobbyScreen {...commonProps} />
    case 'briefing':
    case 'night': return <NightScreen {...commonProps} mafiaTeammates={mafiaTeammates} />
    case 'day': return <DayScreen {...commonProps} />
    case 'voting': return <VotingScreen {...commonProps} />
    case 'results': return <ResultsScreen {...commonProps} lastResult={lastResult} />
    case 'ended': return <GameEndedScreen {...commonProps} />
    default:
      return (
        <View style={styles.loading}>
          <ActivityIndicator color="#DC143C" size="large" />
          <Text style={styles.loadingText}>{phase}...</Text>
        </View>
      )
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0005', justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#555', letterSpacing: 2, fontSize: 13 },
  loadingSubText: { color: '#333', fontSize: 11, textAlign: 'center', paddingHorizontal: 40 },
})