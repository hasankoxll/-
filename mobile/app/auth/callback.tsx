import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { handleAuthCallback } from '@/lib/auth';

export default function AuthCallbackScreen(){
  const [done,setDone]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const initial=await Linking.getInitialURL();
        if(!initial) throw new Error('AUTH_CALLBACK_MISSING');
        await handleAuthCallback(initial);
        if(active)setDone(true);
      }catch(e){if(active)setError(e instanceof Error?e.message:'AUTH_CALLBACK_FAILED');}
    })();
    return()=>{active=false};
  },[]);

  if(done)return <Redirect href="/(tabs)"/>;
  return <View style={s.c}>{error?<><Text style={s.h}>تعذر إكمال الدخول</Text><Text style={s.e}>{error}</Text></>:<><ActivityIndicator color="#c7ff5e"/><Text style={s.p}>جاري تأمين جلسة Vaultify…</Text></>}</View>
}
const s=StyleSheet.create({c:{flex:1,backgroundColor:'#07090d',alignItems:'center',justifyContent:'center',padding:24},h:{color:'#f5f7fb',fontSize:22,fontWeight:'900'},p:{color:'#8f9bad',marginTop:14},e:{color:'#f8b4b4',marginTop:12,textAlign:'center'}});
