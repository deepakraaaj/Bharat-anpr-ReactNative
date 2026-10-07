/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/PlateScanner', () => 'PlateScanner');
jest.mock('react-native-vision-camera', () => ({useCameraPermission: () => ({hasPermission: true, requestPermission: jest.fn()})}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
