import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSessionState } from '@/lib/session';
import { sendMagicLink } from '@/lib/auth';

export default function LoginScreen() {
  const { session, loading } = useSessionState();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!loading && session) return <Redirect href="/(tabs)" />;

  async function submit() {
    setSending(true); setMessage(null);
    try {
      await sendMagicLink(email);
      setMessage('تم إرسال رابط الدخول. افتح بريدك واضغط الرابط للعودة إلى Vaultify.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'تعذر إرسال رابط الدخول');
    } finally { setSending(false); }
  }

  return (
    <View style={s.screen}>
      <Text style={s.brand}>VAULTIFY</Text>
      <Text style={s.title}>Revenue Command Center</Text>
      <Text style={s.subtitle}>دخول آمن بدون كلمة مرور</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="البريد الإلكتروني"
        placeholderTextColor="#667085"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={s.input}
      />
      <Pressable onPress={submit} disabled={sending || !email.trim()} style={({pressed})=>[s.button,(pressed||sending)&&s.buttonDown]}>
        {sending ? <ActivityIndicator color="#071006" /> : <Text style={s.buttonText}>إرسال رابط الدخول</Text>}
      </Pressable>
      {message ? <Text style={s.message}>{message}</Text> : null}
      <Text style={s.security}>الجلسة تُحفظ محليًا في SecureStore. مفاتيح Meta وSalla وMoyasar لا تدخل التطبيق.</Text>
    </View>
  );
}

const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#07090d',paddingHorizontal:24,justifyContent:'center'},
  brand:{color:'#c7ff5e',fontWeight:'900',letterSpacing:2,fontSize:13},
  title:{color:'#f5f7fb',fontSize:31,fontWeight:'900',marginTop:10},
  subtitle:{color:'#8f9bad',fontSize:15,marginTop:8,marginBottom:28},
  input:{backgroundColor:'#0f131a',borderWidth:1,borderColor:'#28313e',borderRadius:16,color:'#f5f7fb',paddingHorizontal:16,paddingVertical:15,fontSize:16,textAlign:'right'},
  button:{marginTop:14,backgroundColor:'#c7ff5e',borderRadius:16,paddingVertical:15,alignItems:'center'},
  buttonDown:{opacity:.75},
  buttonText:{color:'#071006',fontWeight:'900',fontSize:16},
  message:{color:'#cbd5e1',marginTop:16,lineHeight:22,textAlign:'right'},
  security:{color:'#667085',fontSize:11,lineHeight:18,marginTop:28,textAlign:'right'}
});
