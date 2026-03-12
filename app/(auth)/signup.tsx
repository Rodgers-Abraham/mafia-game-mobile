import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

const COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722','#8bc34a','#607d8b']

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !username || !password) { Alert.alert('Error', 'Please fill in all fields'); return }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return }
    if (username.length < 3) { Alert.alert('Error', 'Username must be at least 3 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, avatar_color: selectedColor } },
    })
    if (error) Alert.alert('Signup Failed', error.message)
    else Alert.alert('Success! 🎉', 'Account created! You can now sign in.', [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }])
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.skull}>🎭</Text>
        <Text style={styles.title}>JOIN THE GAME</Text>
        <Text style={styles.subtitle}>-- CREATE YOUR IDENTITY --</Text>

        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#444" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>USERNAME</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Choose a name..." placeholderTextColor="#444" autoCapitalize="none" maxLength={20} />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#444" secureTextEntry />

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor="#444" secureTextEntry />

          <Text style={styles.label}>CHOOSE YOUR COLOR</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorSelected]}
              />
            ))}
          </View>

          <View style={styles.preview}>
            <View style={[styles.avatar, { backgroundColor: selectedColor }]}>
              <Text style={styles.avatarText}>{username ? username[0].toUpperCase() : '?'}</Text>
            </View>
            <Text style={styles.previewName}>{username || 'Your Name'}</Text>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'CREATING...' : '🎭 CREATE ACCOUNT'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={{ color: '#DC143C' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0005' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  skull: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 36, color: '#DC143C', textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 },
  subtitle: { color: '#444', textAlign: 'center', letterSpacing: 4, marginBottom: 32, fontSize: 11 },
  card: { backgroundColor: 'rgba(139,0,0,0.1)', borderWidth: 1, borderColor: '#8B000044', borderRadius: 20, padding: 24 },
  label: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#3d002066', borderRadius: 12, padding: 14, color: 'white', fontSize: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderColor: 'white', transform: [{ scale: 1.2 }] },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  previewName: { color: 'white', fontSize: 16, fontWeight: '600' },
  btn: { backgroundColor: '#8B0000', borderWidth: 1, borderColor: '#DC143C', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#555', fontSize: 14 },
})
