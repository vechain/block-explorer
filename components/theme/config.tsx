'use client'

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
import { textStyles } from './text-styles'

export enum ColorMode {
  LIGHT = 'light',
  DARK = 'dark',
}

const config = defineConfig({
  theme: {
    textStyles,
    tokens: {
      fonts: {
        heading: { value: `var(--font-rubik), 'Rubik', sans-serif` },
        body: { value: `var(--font-rubik), 'Rubik', sans-serif` },
      },
      colors: {
        // Text colors
        'text-primary': { value: 'rgba(238, 243, 247, 1)' },
        'text-secondary': { value: 'rgba(195, 198, 200, 1)' },
        'text-alt': { value: 'rgba(186, 196, 220, 1)' },
        // Background colors
        'bg-primary': { value: 'rgba(11, 12, 16, 1)' },
        'bg-card-surface': { value: 'rgba(255, 255, 255, 0.06)' },
        'bg-card-surface-2': { value: 'rgba(255, 255, 255, 0.1)' },
        'bg-card-surface-3': { value: 'rgba(255, 255, 255, 0.2)' },
        'bg-card-surface-hover': { value: 'rgba(255, 255, 255, 0.1)' },
        'bg-card-surface-active': { value: 'rgba(255, 255, 255, 0.2)' },
        'bg-surface-alt': { value: 'rgba(0, 0, 0, 0.2)' },
        'bg-surface-alt-1': { value: 'rgba(0, 0, 0, 0.1)' },
        'bg-surface-alt-hover': { value: 'rgba(0, 0, 0, 0.4)' },
        // Border colors
        'border-surface': { value: 'rgba(255, 255, 255, 0.2)' },
        'border-surface-2': { value: 'rgba(255, 255, 255, 0.4)' },
        // Blur colors
        'blur-blue': { value: 'rgba(54, 24, 251, 1)' },
        'blur-purple': { value: 'rgba(143, 66, 221, 1)' },
        'blur-pink': { value: 'rgba(165, 12, 141, 1)' },
        // Status colors
        'success-text': { value: 'rgba(16, 255, 161, 1)' },
        'success-surface': { value: 'rgba(16, 255, 161, 0.26)' },
        'error-surface': { value: 'rgba(255, 138, 138, 0.2)' },
        'error-text': { value: 'rgba(255, 138, 138, 1)' },
        'pending-surface': { value: 'rgba(246, 255, 165, 0.2)' },
        'pending-text': { value: 'rgba(246, 255, 165, 1)' },
        // Highlight colors
        'highlight-primary': { value: 'rgba(184, 166, 255, 1)' },
        'highlight-secondary': { value: 'rgba(231, 130, 255, 1)' },
        'highlight-tertiary': { value: 'rgba(56, 216, 153, 1)' },
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
        black: {
          value: '#000',
        },
        white: {
          value: '#fff',
        },
      },
      radii: {
        xs: { value: '12px' },
        sm: { value: '16px' },
        md: { value: '20px' },
      },
      fontSizes: {
        'display-m-desktop': { value: '52px' },
        'display-m-mobile': { value: '32px' },
        'display-s': { value: '24px' },
        'display-xs': { value: '20px' },
        'body-l': { value: '16px' },
        'body-m': { value: '14px' },
        'body-s': { value: '12px' },
      },
      lineHeights: {
        display: { value: '90%' },
        body: { value: '150%' },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
