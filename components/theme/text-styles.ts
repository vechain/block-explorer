/**
 * These can be used with Chakra UI components via the `textStyle` prop or spread directly
 */

export const textStyles = {
  'display-m': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: { base: '32px', md: '52px' },
    lineHeight: '90%',
  },
  'display-s': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '24px',
    lineHeight: '90%',
  },
  'display-xs': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '20px',
    lineHeight: '90%',
  },
  'body-l': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
  },
  'body-l-semibold': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    fontWeight: '600',
  },
  'body-m': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '14px',
    lineHeight: '150%',
  },
  'body-m-semibold': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '14px',
    lineHeight: '150%',
    fontWeight: '600',
  },
  'body-s': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '12px',
    lineHeight: '150%',
  },
  'body-s-semibold': {
    fontFamily: 'var(--font-rubik), "Rubik", sans-serif',
    fontSize: '12px',
    lineHeight: '150%',
    fontWeight: '600',
  },
} as const

export type TextStyle = keyof typeof textStyles

