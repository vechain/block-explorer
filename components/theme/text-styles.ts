import { defineTextStyles } from '@chakra-ui/react'

export const textStyles = defineTextStyles({
  displayM: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: { base: '32px', md: '52px' },
      lineHeight: '90%',
      fontWeight: '400',
    },
  },
  displayS: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '24px',
      lineHeight: '90%',
      fontWeight: '400',
    },
  },
  displayXs: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '20px',
      lineHeight: '90%',
      fontWeight: '400',
    },
  },
  bodyL: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '16px',
      lineHeight: '150%',
      fontWeight: '400',
    },
  },
  bodyLSemibold: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '16px',
      lineHeight: '150%',
      fontWeight: '600',
    },
  },
  bodyM: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '14px',
      lineHeight: '150%',
      fontWeight: '400',
    },
  },
  bodyMSemibold: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '14px',
      lineHeight: '150%',
      fontWeight: '600',
    },
  },
  bodySSemibold: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '12px',
      lineHeight: '150%',
      fontWeight: '600',
    },
  },
  bodyS: {
    value: {
      fontFamily: "var(--font-rubik), 'Rubik', sans-serif",
      fontSize: '12px',
      lineHeight: '150%',
      fontWeight: '400',
    },
  },
})
