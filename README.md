# Bharat ANPR Mobile (React Native)

Separate React Native implementation of the offline Indian ANPR application.

## Architecture

- React Native 0.87 owns navigation, history, settings and confirmation UI.
- A Kotlin native view owns CameraX preview and analysis, so frames never cross the JS bridge.
- `YoloPlateDetector` is the native LiteRT boundary for plate localization.
- ML Kit performs offline OCR only on YOLO plate crops.
- Kotlin validates standard Indian and Bharat-series registrations.
- Candidate strings cross into React Native for selection and confirmation.

## Model required

No unlicensed weights are included. Follow `android/app/src/main/assets/models/README.md` and add a licensed Indian-plate INT8 model plus its exact tensor decoder.

Until then, preview works but detection fails closed and shows `YOLO model required`.

## Build

Use Node 22.11+ and JDK 17:

```bash
npm install
npm test -- --runInBand
npm run lint
cd android
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ./gradlew assembleDebug
```
