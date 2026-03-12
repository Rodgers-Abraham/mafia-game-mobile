import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Login Failed', error.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.skull}>💀</Text>
        <Text style={styles.title}>MAFIA</Text>
        <Text style={styles.subtitle}>-- SIGN IN TO PLAY --</Text>

        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#444"
            secureTextEntry
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'SIGNING IN...' : '🔫 SIGN IN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.link}>
            <Text style={styles.linkText}>No account? <Text style={{ color: '#DC143C' }}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  skull: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 52, color: '#DC143C', textAlign: 'center', fontWeight: 'bold', letterSpacing: 8, textShadowColor: '#DC143C', textShadowRadius: 20 },
  subtitle: { color: '#444', textAlign: 'center', letterSpacing: 4, marginBottom: 40, fontSize: 11 },
  card: { backgroundColor: 'rgba(139,0,0,0.1)', borderWidth: 1, borderColor: '#8B000044', borderRadius: 20, padding: 24 },
  label: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#3d002066', borderRadius: 12, padding: 14, color: 'white', fontSize: 16 },
  btn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#555', fontSize: 14 },
})