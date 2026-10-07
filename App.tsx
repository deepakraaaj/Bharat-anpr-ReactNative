import React, {useEffect, useState} from 'react';
import {Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useCameraPermission} from 'react-native-vision-camera';
import PlateScanner from './src/PlateScanner';

type Screen = 'Scan' | 'History' | 'Settings' | 'About';
type HistoryRow = {plate: string; timestamp: number};
const tabs: Screen[] = ['Scan', 'History', 'Settings', 'About'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('Scan');
  const {hasPermission: permission, requestPermission: requestCamera} = useCameraPermission();
  const [status, setStatus] = useState('Starting camera…');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>();
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => { if (!permission) requestCamera(); }, [permission, requestCamera]);

  const confirm = () => {
    if (!selected) return;
    setHistory(rows => [{plate: selected, timestamp: Date.now()}, ...rows]);
    setCandidates([]); setSelected(undefined); setStatus('Saved · scanning resumed');
  };
  const cancel = () => {setCandidates([]); setSelected(undefined);};

  let body: React.ReactNode;
  if (screen === 'History') {
    body = <View style={styles.page}><Text style={styles.heading}>Detection history</Text>{history.length === 0 ? <Text style={styles.muted}>No confirmed plates yet.</Text> : history.map(row => <View key={`${row.plate}-${row.timestamp}`} style={styles.card}><Text style={styles.plate}>{row.plate}</Text><Text style={styles.muted}>{new Date(row.timestamp).toLocaleString()}</Text></View>)}</View>;
  } else if (screen === 'Settings') {
    body = <View style={styles.page}><Text style={styles.heading}>Settings</Text><Info label="Camera" value="VisionCamera · 4 scans/sec"/><Info label="Detection" value="Guide box (YOLO model not bundled)"/><Info label="OCR" value="ML Kit · offline"/><Info label="Confirmation" value="Required before saving"/></View>;
  } else if (screen === 'About') {
    body = <View style={styles.page}><Text style={styles.heading}>Bharat ANPR Mobile</Text><Text style={styles.copy}>Offline-first Indian number-plate recognition. Camera frames and OCR stay on this device.</Text><Text style={styles.subheading}>How it works</Text><Text style={styles.copy}>Built entirely in React Native with VisionCamera and ML Kit text recognition. No custom native code.</Text></View>;
  } else {
    body = <View style={styles.scanner}>{permission ? <PlateScanner active={candidates.length === 0} onCandidates={values => {setCandidates(values); setSelected(values[0]);}} onStatus={setStatus}/> : <View style={styles.center}><Text style={styles.copy}>Camera permission is required.</Text><Pressable style={styles.button} onPress={requestCamera}><Text style={styles.buttonText}>Grant camera access</Text></Pressable></View>}<View pointerEvents="none" style={styles.guide}/><View style={styles.statusCard}><Text style={styles.status}>{status}</Text><Text style={styles.hint}>Align the full plate inside the box</Text></View></View>;
  }

  return <SafeAreaView style={styles.root}><StatusBar barStyle="light-content"/><View style={styles.content}>{body}</View><View style={styles.tabs}>{tabs.map(tab => <Pressable key={tab} style={styles.tab} onPress={() => setScreen(tab)}><Text style={[styles.tabText, screen === tab && styles.tabSelected]}>{tab}</Text></Pressable>)}</View><Modal transparent visible={candidates.length > 0} animationType="fade" onRequestClose={cancel}><View style={styles.modalBackdrop}><View style={styles.dialog}><Text style={styles.heading}>{candidates.length > 1 ? 'Select a number plate' : 'Confirm number plate'}</Text><Text style={styles.muted}>{candidates.length > 1 ? 'Multiple plates were found. Choose one to process.' : 'Is this the correct plate?'}</Text>{candidates.map(value => <Pressable key={value} style={[styles.candidate, selected === value && styles.candidateSelected]} onPress={() => setSelected(value)}><Text style={styles.radio}>{selected === value ? '●' : '○'}</Text><Text style={styles.plate}>{value}</Text></Pressable>)}<View style={styles.actions}><Pressable onPress={cancel}><Text style={styles.cancel}>Cancel</Text></Pressable><Pressable style={styles.button} onPress={confirm}><Text style={styles.buttonText}>Confirm</Text></Pressable></View></View></View></Modal></SafeAreaView>;
}

function Info({label, value}: {label: string; value: string}) { return <View style={styles.card}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.muted}>{value}</Text></View>; }

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#080B10'},content:{flex:1},scanner:{flex:1,backgroundColor:'#05070A'},page:{flex:1,padding:24,gap:16},center:{flex:1,alignItems:'center',justifyContent:'center',gap:16},heading:{fontSize:25,fontWeight:'800',color:'#F8FAFC'},subheading:{fontSize:18,fontWeight:'700',color:'#FFB300',marginTop:18},copy:{fontSize:16,lineHeight:24,color:'#D5DBE5'},muted:{fontSize:14,color:'#929CAB'},guide:{position:'absolute',left:'8%',right:'8%',top:'34%',height:'25%',borderColor:'#FFB300',borderWidth:3,borderRadius:16},statusCard:{position:'absolute',left:20,right:20,bottom:24,backgroundColor:'rgba(8,11,16,.88)',padding:18,borderRadius:18,borderWidth:1,borderColor:'#252B35'},status:{color:'#FFF',fontWeight:'700',fontSize:17,textAlign:'center'},hint:{color:'#AAB2BF',textAlign:'center',marginTop:6},tabs:{height:68,flexDirection:'row',borderTopWidth:1,borderTopColor:'#252B35',backgroundColor:'#10141B'},tab:{flex:1,alignItems:'center',justifyContent:'center'},tabText:{color:'#818A98',fontWeight:'600'},tabSelected:{color:'#FFB300'},card:{padding:16,borderRadius:14,backgroundColor:'#121720',gap:4},plate:{fontSize:20,fontWeight:'800',color:'#F8FAFC',letterSpacing:1},infoLabel:{color:'#FFF',fontWeight:'700',marginBottom:4},button:{backgroundColor:'#FFB300',paddingHorizontal:20,paddingVertical:12,borderRadius:12},buttonText:{color:'#171006',fontWeight:'800'},modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.72)',alignItems:'center',justifyContent:'center',padding:24},dialog:{width:'100%',maxWidth:440,backgroundColor:'#151A22',borderRadius:22,padding:22,gap:14},candidate:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderWidth:1,borderColor:'#343B47',borderRadius:14},candidateSelected:{borderColor:'#FFB300',backgroundColor:'#2A2415'},radio:{fontSize:20,color:'#FFB300'},actions:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:22,marginTop:8},cancel:{color:'#D1D6DF',fontWeight:'700'}
});
