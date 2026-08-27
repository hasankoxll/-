import { StyleSheet, Text, View } from 'react-native';
export default function OpsScreen(){return <View style={s.c}><Text style={s.h}>Ops Watchdog</Text><Text style={s.p}>Integration health, incidents, DLQ and Revenue at Risk.</Text></View>}
const s=StyleSheet.create({c:{flex:1,backgroundColor:'#07090d',padding:24,paddingTop:70},h:{color:'#f5f7fb',fontSize:26,fontWeight:'900'},p:{color:'#8f9bad',marginTop:10,lineHeight:22}});
