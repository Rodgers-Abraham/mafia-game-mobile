import { useEffect, useRef, useState } from 'react'
import { View, ActivityIndicator, Text, StyleSheet, AppState } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io, Socket } from 'socket.io-client'
import { supabase } from '@/lib/supabase'

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
  const [reconnectInfo, setReconnectInfo] = useState<any>(null)
  const [connected, setConnected] = useState(false)

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
    const { playerId: pid, roomId: rid } = JSON.parse(stored)
    setPlayerId(pid)

    const socket = io(SERVER_URL)
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('rejoin-room', { roomId: rid, playerId: pid }, (res: any) => {
        if (res?.room) {
          setRoom(res.room)
          setPhase(res.room.phase)
        }
      })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('room-updated', (updatedRoom: any) => {
      setRoom(updatedRoom)
      setPhase(updatedRoom.phase)
    })

    socket.on('game-started', (updatedRoom: any) => {
      setRoom(updatedRoom)
      setPhase('briefing')
    })

    socket.on('phase-changed', ({ phase, room }: any) => {
      setPhase(phase)
      if (room) setRoom(room)
    })

    socket.on('mafia-team', (teammates: any[]) => {
      setMafiaTeammates(teammates)
    })

    socket.on('night-result', (result: any) => {
      setLastResult(result)
    })

    socket.on('vote-result', (result: any) => {
      setLastResult(result)
    })

    socket.on('player-disconnected', ({ playerName, gracePeriod }: any) => {
      setReconnectInfo({ playerName, gracePeriod, countdown: gracePeriod })
      showNotification(`⚠️ ${playerName} disconnected`)
    })

    socket.on('player-reconnected', ({ playerName }: any) => {
      setReconnectInfo(null)
      showNotification(`✅ ${playerName} reconnected`)
    })

    socket.on('player-kicked', ({ playerName }: any) => {
      setReconnectInfo(null)
      showNotification(`❌ ${playerName} was removed`)
    })

    socket.on('player-joined', ({ playerName }: any) => {
      showNotification(`👤 ${playerName} joined`)
    })

    socket.on('player-left', ({ playerName }: any) => {
      showNotification(`👤 ${playerName} left`)
    })
  }

  const currentPlayer = room?.players?.find((p: any) => p.id === playerId)
  const isSpectating = currentPlayer && !currentPlayer.isAlive && phase !== 'ended' && phase !== 'lobby'

  if (!room || !playerId) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#DC143C" size="large" />
        <Text style={styles.loadingText}>Connecting to server...</Text>
      </View>
    )
  }

  const commonProps = {
    room,
    playerId,
    socket: socketRef.current,
    notification,
    onLeave: async () => {
      socketRef.current?.emit('leave-room', { roomId: room.id, playerId })
      await AsyncStorage.removeItem('roomData')
      router.replace('/(game)/home')
    },
  }

  if (isSpectating) return <SpectatorScreen {...commonProps} />

  switch (phase) {
    case 'lobby':
      return <LobbyScreen {...commonProps} />
    case 'briefing':
    case 'night':
      return <NightScreen {...commonProps} mafiaTeammates={mafiaTeammates} />
    case 'day':
      return <DayScreen {...commonProps} />
    case 'voting':
      return <VotingScreen {...commonProps} />
    case 'results':
      return <ResultsScreen {...commonProps} lastResult={lastResult} />
    case 'ended':
      return <GameEndedScreen {...commonProps} />
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
  loading: { flex: 1, backgroundColor: '#0a0005', justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#555', letterSpacing: 2, fontSize: 13 },
})