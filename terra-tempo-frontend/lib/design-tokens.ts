/**
 * Design Tokens for Terra Tempo
 * Deterministically generated from: sha256("Terra Tempo" + "Sepolia" + "202511" + "TerraTempoCore.sol")
 * Theme: Modern Agricultural Minimalism
 * Provides consistent styling across light and dark modes
 */

export const designTokens = {
  colors: {
    light: {
      primary: '#4A7C59', // Earthy Green
      primaryHover: '#3A6349',
      secondary: '#D4A574', // Harvest Gold
      secondaryHover: '#C49564',
      accent: '#87CEEB', // Sky Blue
      accentHover: '#77BEDB',
      neutral: '#F5F5F0', // Warm Gray
      neutralDark: '#E5E5E0',
      danger: '#C44536', // Rust Red
      dangerHover: '#B43526',
      success: '#4A7C59',
      warning: '#D4A574',
      background: '#FFFFFF',
      surface: '#F5F5F0',
      border: '#E5E5E0',
      text: {
        primary: '#1A1A1A',
        secondary: '#4A4A4A',
        disabled: '#9A9A9A',
        inverse: '#FFFFFF',
      },
    },
    dark: {
      primary: '#6FAF82', // Soft Green
      primaryHover: '#5F9F72',
      secondary: '#D4A574',
      secondaryHover: '#C49564',
      accent: '#87CEEB',
      accentHover: '#77BEDB',
      neutral: '#2A2A2A',
      neutralDark: '#1A1A1A',
      danger: '#E55546',
      dangerHover: '#D54536',
      success: '#6FAF82',
      warning: '#D4A574',
      background: '#1A1A1A',
      surface: '#2A2A2A',
      border: '#3A3A3A',
      text: {
        primary: '#E8E8E8',
        secondary: '#B8B8B8',
        disabled: '#6A6A6A',
        inverse: '#1A1A1A',
      },
    },
  },
  
  spacing: {
    compact: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    comfortable: {
      xs: '6px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '40px',
      '3xl': '48px',
    },
  },
  
  typography: {
    fontFamily: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
      mono: 'Roboto Mono, Courier New, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 2px 8px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.2)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
  
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    tooltip: 1100,
    notification: 1200,
  },
} as const;

export type DesignTokens = typeof designTokens;
export type ColorMode = 'light' | 'dark';
export type SpacingMode = 'compact' | 'comfortable';


