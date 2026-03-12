import { View, Text, StyleSheet, Animated, useEffect, useRef } from 'react-native'

interface Props { message: string | null }

export default function NotificationBanner({ message }: Props) {
  if (!message) return null
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 48, left: 16, right: 16, zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.9)', borderWidth: 1, borderColor: '#DC143C44',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  text: { color: 'white', fontSize: 13, textAlign: 'center' },
})