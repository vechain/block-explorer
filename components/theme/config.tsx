'use client'

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

export enum ColorMode {
  LIGHT = 'light',
  DARK = 'dark',
}

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Inter', sans-serif` },
        body: { value: `'Inter', sans-serif` },
      },
      colors: {
        gray: {
          50: { value: '#F9F9FA' },
          100: { value: '#F1F2F3' },
          200: { value: '#E7E9EB' },
          300: { value: '#D2D5D9' },
          400: { value: '#AAAFB6' },
          500: { value: '#747C89' },
          600: { value: '#525860' },
          700: { value: '#363A3F' },
          800: { value: '#1B1D1F' },
          900: { value: '#171923' },
        },
        primary: {
          50: { value: '#F9F8FB' },
          100: { value: '#F0EEFC' },
          200: { value: '#CCC3F4' },
          300: { value: '#A897EC' },
          400: { value: '#836CE4' },
          500: { value: '#6042DD' },
          600: { value: '#4424C6' },
          700: { value: '#351C9B' },
          800: { value: '#261470' },
          900: { value: '#170D45' },
        },
        blue: {
          50: { value: '#EBF8FF' },
          100: { value: '#BEE3F8' },
          200: { value: '#90CDF4' },
          300: { value: '#63B3ED' },
          400: { value: '#4299E1' },
          500: { value: '#3182CE' },
          600: { value: '#2B6CB0' },
          700: { value: '#2C5282' },
          800: { value: '#2A4365' },
          900: { value: '#1A365D' },
        },
        green: {
          50: { value: '#F0FFF4' },
          100: { value: '#C6F6D5' },
          200: { value: '#9AE6B4' },
          300: { value: '#68D391' },
          400: { value: '#48BB78' },
          500: { value: '#38A169' },
          600: { value: '#25855A' },
          700: { value: '#276749' },
          800: { value: '#22543D' },
          900: { value: '#1C4532' },
        },
        red: {
          50: { value: '#FFF5F5' },
          100: { value: '#FED7D7' },
          200: { value: '#FEB2B2' },
          300: { value: '#FC8181' },
          400: { value: '#F56565' },
          500: { value: '#E53E3E' },
          600: { value: '#C53030' },
          700: { value: '#9B2C2C' },
          800: { value: '#822727' },
          900: { value: '#63171B' },
        },
        orange: {
          50: { value: '#FFFAF0' },
          100: { value: '#FEEBCB' },
          200: { value: '#FBD38D' },
          300: { value: '#F6AD55' },
          400: { value: '#ED8936' },
          500: { value: '#DD6B20' },
          600: { value: '#C05621' },
          700: { value: '#9C4221' },
          800: { value: '#7B341E' },
          900: { value: '#652B19' },
        },
        black: {
          value: '#000',
        },
        white: {
          value: '#fff',
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
