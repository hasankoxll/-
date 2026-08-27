import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSessionState } from '@/lib/session';

export default function Index() {
  const { session, loading } = useSessionState();
  if (loading) return <View style={s.c}><ActivityIndicator color="#c7ff5e" /></View>;
  return <Redirect href={session ? '/(tabs)' : '/login'} />;
}

const s=StyleSheet.create({c:{flex:1,backgroundColor:'#07090d',alignItems:'center',justifyContent:'center'}});
