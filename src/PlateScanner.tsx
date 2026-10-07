import React, {useEffect, useRef, useState} from 'react';
import {Image, LayoutRectangle, StyleSheet} from 'react-native';
import {Camera, useCameraDevice, usePhotoOutput} from 'react-native-vision-camera';
import TextRecognition, {TextLine} from '@react-native-ml-kit/text-recognition';
import {plateCandidates} from './plateFormat';

/** Guide box as fractions of the scanner view; App.tsx draws the same box. */
export const GUIDE = {left: 0.08, top: 0.34, width: 0.84, height: 0.25};
const SCAN_INTERVAL_MS = 250;

type Props = {
  active: boolean;
  onCandidates: (plates: string[]) => void;
  onStatus: (message: string) => void;
};

const imageSize = (uri: string) =>
  new Promise<{width: number; height: number}>((resolve, reject) => Image.getSize(uri, (width, height) => resolve({width, height}), reject));

/** True when the line's centre falls inside the guide box, mapped through the preview's centre-crop. */
function insideGuide(line: TextLine, image: {width: number; height: number}, view: LayoutRectangle) {
  if (!line.frame) return false;
  let {width: iw, height: ih} = image;
  if (iw > ih !== view.width > view.height) [iw, ih] = [ih, iw];
  const scale = Math.max(view.width / iw, view.height / ih);
  const offsetX = (iw * scale - view.width) / 2;
  const offsetY = (ih * scale - view.height) / 2;
  const x = (line.frame.left + line.frame.width / 2) * scale - offsetX;
  const y = (line.frame.top + line.frame.height / 2) * scale - offsetY;
  return x >= view.width * GUIDE.left && x <= view.width * (GUIDE.left + GUIDE.width)
    && y >= view.height * GUIDE.top && y <= view.height * (GUIDE.top + GUIDE.height);
}

export default function PlateScanner({active, onCandidates, onStatus}: Props) {
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({qualityPrioritization: 'speed'});
  const [started, setStarted] = useState(false);
  const layout = useRef<LayoutRectangle>(null);
  const callbacks = useRef({onCandidates, onStatus});
  callbacks.current = {onCandidates, onStatus};

  useEffect(() => {
    if (!device) callbacks.current.onStatus('No back camera found');
  }, [device]);

  useEffect(() => {
    if (!active || !started) return;
    let cancelled = false;
    // Reuse one cache file so continuous scanning doesn't fill storage with temp photos.
    let framePath: string | undefined;
    // Only report plates read identically in consecutive scans; one-off OCR noise rarely repeats.
    let previous = new Set<string>();
    (async () => {
      callbacks.current.onStatus('Hold the plate inside the frame');
      while (!cancelled) {
        const startedAt = Date.now();
        try {
          const photo = await photoOutput.capturePhoto({enableShutterSound: false}, {});
          framePath ??= (await photo.saveToTemporaryFileAsync()).replace(/[^/]+$/, 'anpr_frame.jpg');
          await photo.saveToFileAsync(framePath);
          photo.dispose();
          const uri = `file://${framePath}`;
          const [result, size] = await Promise.all([TextRecognition.recognize(uri), imageSize(uri)]);
          const view = layout.current;
          if (cancelled || !view) break;
          const lines = result.blocks.flatMap(block => block.lines).filter(line => insideGuide(line, size, view));
          const plates = [...new Set(lines.flatMap(line => plateCandidates(line.text)))];
          if (plates.length === 0) {
            // A plate split across two lines (e.g. "MH12 / AB1234") only validates when joined.
            plates.push(...plateCandidates(lines.map(line => line.text).join('')));
          }
          const stable = plates.filter(plate => previous.has(plate));
          previous = new Set(plates);
          if (stable.length > 0 && !cancelled) {
            callbacks.current.onCandidates(stable);
            break;
          }
        } catch (error) {
          if (!cancelled) callbacks.current.onStatus(error instanceof Error ? error.message : 'Scan failed');
        }
        const wait = SCAN_INTERVAL_MS - (Date.now() - startedAt);
        if (wait > 0) await new Promise<void>(resolve => setTimeout(resolve, wait));
      }
    })();
    return () => { cancelled = true; };
  }, [active, started, photoOutput]);

  if (!device) return null;
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      outputs={[photoOutput]}
      isActive={true}
      resizeMode="cover"
      onLayout={event => { layout.current = event.nativeEvent.layout; }}
      onPreviewStarted={() => setStarted(true)}
    />
  );
}
