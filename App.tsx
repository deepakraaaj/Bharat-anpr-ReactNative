import React, {useEffect, useState} from 'react';
import {Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {useCameraPermission} from 'react-native-vision-camera';
import {History, Info as InfoIcon, LucideIcon, ScanLine, SlidersHorizontal} from 'lucide-react-native';
import Plate from './src/Plate';
import PlateScanner, {GUIDE} from './src/PlateScanner';
import {colors, type} from './src/theme';

type Screen = 'Scan' | 'History' | 'Settings' | 'About';
type HistoryRow = {plate: string; timestamp: number};
const tabs: {name: Screen; icon: LucideIcon}[] = [
  {name: 'Scan', icon: ScanLine},
  {name: 'History', icon: History},
  {name: 'Settings', icon: SlidersHorizontal},
  {name: 'About', icon: InfoIcon},
];

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
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
    setCandidates([]); setSelected(undefined); setStatus('Plate saved. Scanning for the next one.');
  };
  const cancel = () => {setCandidates([]); setSelected(undefined);};

  let body: React.ReactNode;
  if (screen === 'History') {
    body = (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={type.title}>History</Text>
        {history.length === 0 ? (
          <Text style={type.small}>Confirmed plates appear here. Scan a plate and tap Save to add one.</Text>
        ) : history.map(row => (
          <View key={`${row.plate}-${row.timestamp}`} style={styles.historyRow}>
            <View style={styles.historyPlate}><Plate value={row.plate} size="small" /></View>
            <Text style={styles.time}>{new Date(row.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
          </View>
        ))}
      </ScrollView>
    );
  } else if (screen === 'Settings') {
    body = (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={type.title}>Settings</Text>
        <Info label="Scan rate" value="Up to 4 frames a second" />
        <Info label="Detection" value="Reads text inside the on-screen frame. Automatic plate detection needs a YOLO model, which isn't installed." />
        <Info label="Text recognition" value="Google ML Kit, on this phone. No internet needed." />
        <Info label="Saving" value="Every plate is confirmed by you before it's saved." />
      </ScrollView>
    );
  } else if (screen === 'About') {
    body = (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={type.title}>Bharat ANPR</Text>
        <Text style={type.body}>Reads Indian number plates with the phone camera. Photos and results stay on this device.</Text>
        <Text style={[type.heading, styles.section]}>Reading a plate</Text>
        <Text style={type.body}>Hold the whole plate inside the yellow frame and keep the phone steady. When the same number reads twice in a row, you're asked to confirm it.</Text>
        <Text style={[type.heading, styles.section]}>Supported formats</Text>
        <View style={styles.examples}>
          <Plate value="KA05KC5877" size="small" />
          <Plate value="22BH1234AA" size="small" />
        </View>
      </ScrollView>
    );
  } else {
    body = (
      <View style={styles.scanner}>
        {permission ? (
          <PlateScanner active={candidates.length === 0} onCandidates={values => {setCandidates(values); setSelected(values[0]);}} onStatus={setStatus} />
        ) : (
          <View style={styles.center}>
            <Text style={type.heading}>Camera access is off</Text>
            <Text style={[type.small, styles.centerText]}>Bharat ANPR needs the camera to read plates.</Text>
            <Pressable style={styles.button} onPress={requestCamera}><Text style={styles.buttonText}>Allow camera</Text></Pressable>
          </View>
        )}
        {permission && <Viewfinder />}
        {permission && <View style={styles.statusBar}><Text style={styles.status}>{status}</Text></View>}
      </View>
    );
  }

  const choosing = candidates.length > 1;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>{body}</View>
      <SafeAreaView edges={['bottom']} style={styles.tabs}>
        {tabs.map(({name, icon: Icon}) => {
          const active = screen === name;
          return (
            <Pressable key={name} style={styles.tab} onPress={() => setScreen(name)} accessibilityRole="tab" accessibilityState={{selected: active}}>
              <View style={[styles.tabMark, active && styles.tabMarkActive]} />
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} color={active ? colors.marking : colors.muted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </SafeAreaView>
      <Modal transparent visible={candidates.length > 0} animationType="slide" onRequestClose={cancel}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={type.heading}>{choosing ? 'Which plate is it?' : 'Is this the plate?'}</Text>
            <Text style={type.small}>{choosing ? 'Some characters could be read more than one way. Pick the one that matches.' : 'Check it against the vehicle before saving.'}</Text>
            {candidates.map(value => (
              <Pressable key={value} onPress={() => setSelected(value)} accessibilityRole="radio" accessibilityState={{checked: selected === value}} style={[styles.option, choosing && selected === value && styles.optionSelected]}>
                <Plate value={value} />
              </Pressable>
            ))}
            <View style={styles.actions}>
              <Pressable style={styles.secondary} onPress={cancel}><Text style={styles.secondaryText}>Scan again</Text></Pressable>
              <Pressable style={[styles.button, styles.grow]} onPress={confirm}><Text style={styles.buttonText}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Corner brackets marking the region PlateScanner reads; positioned from the same GUIDE fractions. */
function Viewfinder() {
  const frame = {left: `${GUIDE.left * 100}%`, top: `${GUIDE.top * 100}%`, width: `${GUIDE.width * 100}%`, height: `${GUIDE.height * 100}%`} as const;
  return (
    <View pointerEvents="none" style={[styles.frame, frame]}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
  );
}

function Info({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.info}>
      <Text style={type.heading}>{label}</Text>
      <Text style={type.small}>{value}</Text>
    </View>
  );
}

const CORNER = 34;
const STROKE = 5;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.asphalt},
  content: {flex: 1},
  page: {padding: 20, gap: 16},
  section: {marginTop: 12},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32},
  centerText: {textAlign: 'center', marginBottom: 8},

  scanner: {flex: 1, backgroundColor: '#000'},
  frame: {position: 'absolute'},
  corner: {position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.marking},
  topLeft: {top: 0, left: 0, borderTopWidth: STROKE, borderLeftWidth: STROKE, borderTopLeftRadius: 10},
  topRight: {top: 0, right: 0, borderTopWidth: STROKE, borderRightWidth: STROKE, borderTopRightRadius: 10},
  bottomLeft: {bottom: 0, left: 0, borderBottomWidth: STROKE, borderLeftWidth: STROKE, borderBottomLeftRadius: 10},
  bottomRight: {bottom: 0, right: 0, borderBottomWidth: STROKE, borderRightWidth: STROKE, borderBottomRightRadius: 10},
  statusBar: {position: 'absolute', left: 16, right: 16, bottom: 20, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: 'rgba(30,35,40,.92)'},
  status: {...type.body, fontWeight: '600', textAlign: 'center'},

  historyRow: {flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.asphaltLine},
  historyPlate: {flex: 1},
  time: {...type.small, fontVariant: ['tabular-nums']},
  info: {gap: 4, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.asphaltLine},
  examples: {gap: 10, alignSelf: 'flex-start', width: 230},

  tabs: {flexDirection: 'row', backgroundColor: colors.asphalt, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.asphaltLine},
  tab: {flex: 1, alignItems: 'center', paddingBottom: 10, minHeight: 64},
  tabMark: {width: 28, height: 3, borderRadius: 2, marginBottom: 8, backgroundColor: 'transparent'},
  tabMarkActive: {backgroundColor: colors.marking},
  tabText: {fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 4},
  tabTextActive: {color: colors.text},

  backdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.55)'},
  sheet: {backgroundColor: colors.asphaltRaised, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 14},
  option: {padding: 4, borderRadius: 11, borderWidth: 2, borderColor: 'transparent'},
  optionSelected: {borderColor: colors.marking},
  actions: {flexDirection: 'row', gap: 12, marginTop: 6},
  grow: {flex: 1},
  button: {minHeight: 50, paddingHorizontal: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.marking},
  buttonText: {fontSize: 16, fontWeight: '800', color: colors.markingInk},
  secondary: {minHeight: 50, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.asphaltLine},
  secondaryText: {fontSize: 16, fontWeight: '600', color: colors.text},
});
