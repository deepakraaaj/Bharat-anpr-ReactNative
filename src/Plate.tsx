import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {formatPlate} from './plateFormat';
import {colors} from './theme';

/** A plate number drawn as an Indian HSRP plate: white face, black characters, blue IND strip. */
export default function Plate({value, size = 'large'}: {value: string; size?: 'large' | 'small'}) {
  const small = size === 'small';
  return (
    <View style={[styles.plate, small && styles.plateSmall]}>
      <View style={[styles.strip, small && styles.stripSmall]}>
        <Text style={[styles.ind, small && styles.indSmall]}>IND</Text>
      </View>
      <Text style={[styles.number, small && styles.numberSmall]} numberOfLines={1} adjustsFontSizeToFit>
        {formatPlate(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.plate,
    borderWidth: 2.5,
    borderColor: colors.plateInk,
    borderRadius: 7,
    overflow: 'hidden',
    minHeight: 58,
  },
  plateSmall: {minHeight: 40, borderWidth: 2, borderRadius: 5},
  strip: {width: 30, backgroundColor: colors.indBlue, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6},
  stripSmall: {width: 22, paddingBottom: 4},
  ind: {color: colors.plate, fontSize: 10, fontWeight: '800', letterSpacing: 0.5},
  indSmall: {fontSize: 7},
  number: {
    flex: 1,
    alignSelf: 'center',
    textAlign: 'center',
    paddingHorizontal: 12,
    color: colors.plateInk,
    fontFamily: 'sans-serif-condensed',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2,
  },
  numberSmall: {fontSize: 20, letterSpacing: 1.5, paddingHorizontal: 8},
});
