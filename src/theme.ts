export const colors = {
  asphalt: '#1E2328',
  asphaltRaised: '#272D33',
  asphaltLine: '#363D44',
  marking: '#F2C230',
  markingInk: '#1E1A0A',
  plate: '#F7F7F2',
  plateInk: '#111316',
  indBlue: '#1F4AA8',
  text: '#ECEEF0',
  muted: '#8C949C',
};

export const type = {
  title: {fontSize: 28, lineHeight: 34, fontWeight: '800' as const, color: colors.text},
  heading: {fontSize: 18, lineHeight: 24, fontWeight: '700' as const, color: colors.text},
  body: {fontSize: 16, lineHeight: 24, color: colors.text},
  small: {fontSize: 14, lineHeight: 20, color: colors.muted},
};
