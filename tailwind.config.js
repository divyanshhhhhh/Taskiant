/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Midnight Theme
                background: {
                    primary: '#0B0E14',
                    secondary: '#12151C',
                    tertiary: '#1A1F2A',
                },
                border: '#2A3140',
                text: {
                    primary: '#E4E8EF',
                    secondary: '#8B95A8',
                    muted: '#5C6678',
                },
                accent: {
                    DEFAULT: '#3B82F6',
                    hover: '#60A5FA',
                    muted: '#1E3A5F',
                },
                success: '#10B981',
                priority: {
                    1: '#EF4444',
                    2: '#F97316',
                    3: '#EAB308',
                    4: '#6B7280',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'check': 'check 0.3s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                check: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
}
