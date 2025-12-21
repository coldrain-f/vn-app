// Theme definitions for VN;READER
import { TextStyle, ViewStyle } from 'react-native';

export interface ThemeColors {
    primary: string;
    primaryDim: string;
    accent: string;
    error: string;
    warning: string;
    info: string;
    success: string;
    dark: string;
    darker: string;
    background: string; // Added background
    panel: string;
    panelHover: string;
    border: string;
    borderGlow: string;
    text: string;
    textDim: string;
    textLight: string;
}

export interface Theme {
    name: string;
    colors: ThemeColors;
    glowShadow: string;
    textGlow: string;
}

const baseColors = {
    text: '#e0e0e0',
    textDim: 'rgba(255, 255, 255, 0.7)',
    textLight: '#ffffff',
};

export const themes: Record<string, Theme> = {
    steinsgate: {
        name: 'Steins;Gate',
        colors: {
            ...baseColors,
            primary: '#00ff41',
            primaryDim: '#00aa2a',
            accent: '#ff6b00',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#00d4ff',
            success: '#4caf50',
            dark: '#0a0a0a',
            darker: '#050505',
            background: '#050505', // Mapped to darker
            panel: 'rgba(10, 20, 15, 0.85)',
            panelHover: 'rgba(15, 30, 20, 0.9)',
            border: 'rgba(0, 255, 65, 0.3)',
            borderGlow: 'rgba(0, 255, 65, 0.6)',
        },
        glowShadow: '0 0 15px rgba(0, 255, 65, 0.4)',
        textGlow: '0 0 10px rgba(0, 255, 65, 0.5)',
    },
    cyberpunk: {
        name: 'Cyberpunk',
        colors: {
            ...baseColors,
            primary: '#ff00ff',
            primaryDim: '#aa00aa',
            accent: '#00ffff',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#00ffff',
            success: '#4caf50',
            dark: '#0a0a1a',
            darker: '#050510',
            background: '#050510',
            panel: 'rgba(15, 10, 25, 0.85)',
            panelHover: 'rgba(25, 15, 35, 0.9)',
            border: 'rgba(255, 0, 255, 0.3)',
            borderGlow: 'rgba(255, 0, 255, 0.6)',
        },
        glowShadow: '0 0 15px rgba(255, 0, 255, 0.4)',
        textGlow: '0 0 10px rgba(255, 0, 255, 0.5)',
    },
    ocean: {
        name: 'Ocean',
        colors: {
            ...baseColors,
            primary: '#00d4ff',
            primaryDim: '#0099bb',
            accent: '#ffaa00',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#00d4ff',
            success: '#4caf50',
            dark: '#0a1015',
            darker: '#050a0f',
            background: '#050a0f',
            panel: 'rgba(10, 20, 30, 0.85)',
            panelHover: 'rgba(15, 30, 45, 0.9)',
            border: 'rgba(0, 212, 255, 0.3)',
            borderGlow: 'rgba(0, 212, 255, 0.6)',
        },
        glowShadow: '0 0 15px rgba(0, 212, 255, 0.4)',
        textGlow: '0 0 10px rgba(0, 212, 255, 0.5)',
    },
    sakura: {
        name: 'Sakura',
        colors: {
            ...baseColors,
            primary: '#ff9ecd',
            primaryDim: '#cc7aa3',
            accent: '#ffcc99',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#ff9ecd',
            success: '#4caf50',
            dark: '#150a10',
            darker: '#0f0508',
            background: '#0f0508',
            panel: 'rgba(25, 15, 20, 0.85)',
            panelHover: 'rgba(35, 20, 28, 0.9)',
            border: 'rgba(255, 158, 205, 0.3)',
            borderGlow: 'rgba(255, 158, 205, 0.6)',
        },
        glowShadow: '0 0 15px rgba(255, 158, 205, 0.4)',
        textGlow: '0 0 10px rgba(255, 158, 205, 0.5)',
    },
    amber: {
        name: 'Amber',
        colors: {
            ...baseColors,
            primary: '#ffaa00',
            primaryDim: '#cc8800',
            accent: '#ff6600',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#ffaa00',
            success: '#4caf50',
            dark: '#0f0a05',
            darker: '#0a0502',
            background: '#0a0502',
            panel: 'rgba(20, 15, 10, 0.85)',
            panelHover: 'rgba(30, 22, 15, 0.9)',
            border: 'rgba(255, 170, 0, 0.3)',
            borderGlow: 'rgba(255, 170, 0, 0.6)',
        },
        glowShadow: '0 0 15px rgba(255, 170, 0, 0.4)',
        textGlow: '0 0 10px rgba(255, 170, 0, 0.5)',
    },
    monochrome: {
        name: 'Monochrome',
        colors: {
            ...baseColors,
            primary: '#ffffff',
            primaryDim: '#aaaaaa',
            accent: '#cccccc',
            error: '#ff0040',
            warning: '#ff9800',
            info: '#ffffff',
            success: '#4caf50',
            dark: '#0a0a0a',
            darker: '#050505',
            background: '#050505',
            panel: 'rgba(15, 15, 15, 0.85)',
            panelHover: 'rgba(25, 25, 25, 0.9)',
            border: 'rgba(255, 255, 255, 0.2)',
            borderGlow: 'rgba(255, 255, 255, 0.4)',
        },
        glowShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
        textGlow: '0 0 8px rgba(255, 255, 255, 0.4)',
    },
    modern: {
        name: 'Modern',
        colors: {
            ...baseColors,
            primary: '#64b5f6',
            primaryDim: '#42a5f5',
            accent: '#ffb74d',
            error: '#ef5350',
            warning: '#ff9800',
            info: '#4fc3f7',
            success: '#4caf50',
            dark: '#1e1e2e',
            darker: '#12121c',
            background: '#12121c',
            panel: 'rgba(30, 30, 46, 0.9)',
            panelHover: 'rgba(40, 40, 60, 0.95)',
            border: 'rgba(255, 255, 255, 0.1)',
            borderGlow: 'rgba(100, 181, 246, 0.5)',
        },
        glowShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textGlow: 'none',
    },
};

export const getTheme = (themeName: string): Theme => {
    return themes[themeName] || themes.steinsgate;
};
