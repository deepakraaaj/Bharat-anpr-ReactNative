/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/PlateScanner', () => ({__esModule: true, default: 'PlateScanner', GUIDE: {left: 0, top: 0, width: 1, height: 1}}));
jest.mock('lucide-react-native', () => new Proxy({}, {get: () => 'Icon'}));
jest.mock('react-native-vision-camera', () => ({useCameraPermission: () => ({hasPermission: true, requestPermission: jest.fn()})}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
