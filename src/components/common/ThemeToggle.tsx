import React from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle?: () => void;
}

/* Cloud SVG Component for Light Mode */
const LightClouds: React.FC = () => (
  <svg
    className="toggle-bg-clouds"
    viewBox="0 0 40 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cloud 1 */}
    <path
      d="M26 18H10C7.23858 18 5 15.7614 5 13C5 10.45 6.89 8.35 9.39 8.05C10.27 5.67 12.56 4 15.25 4C18.42 4 21.04 6.27 21.64 9.32C22.42 8.8 23.36 8.5 24.38 8.5C27.14 8.5 29.38 10.74 29.38 13.5C29.38 14.15 29.25 14.77 29.02 15.34C30.76 15.76 32 17.3 32 19.14C32 21.27 30.27 23 28.14 23H26"
      fill="#FFFFFF"
      fillOpacity="0.9"
    />
    {/* Cloud 2 small */}
    <path
      d="M36 19H24C22.34 19 21 17.66 21 16C21 14.47 22.13 13.21 23.63 13.03C24.16 11.6 25.53 10.6 27.15 10.6C29.05 10.6 30.62 11.96 30.98 13.79C31.45 13.48 32.01 13.3 32.62 13.3C34.28 13.3 35.62 14.64 35.62 16.3C35.62 16.69 35.54 17.06 35.41 17.4C36.45 17.65 37.2 18.57 37.2 19.67"
      fill="#FFFFFF"
      fillOpacity="0.7"
    />
  </svg>
);

/* Dark Clouds & Stars SVG Component for Dark Mode */
const DarkNightBg: React.FC = () => (
  <svg
    className="toggle-bg-night"
    viewBox="0 0 40 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Sparkling Stars */}
    <circle cx="8" cy="7" r="1.1" fill="#FFFFFF" opacity="0.95" />
    <circle cx="16" cy="13" r="0.9" fill="#FDE047" opacity="0.85" />
    <circle cx="22" cy="6" r="1.2" fill="#FFFFFF" opacity="0.9" />
    <path
      d="M12 3.5L12.6 4.8L14 5.5L12.6 6.2L12 7.5L11.4 6.2L10 5.5L11.4 4.8L12 3.5Z"
      fill="#FDE047"
      opacity="0.95"
    />
    <path
      d="M5 13.5L5.4 14.3L6.2 14.7L5.4 15.1L5 15.9L4.6 15.1L3.8 14.7L4.6 14.3L5 13.5Z"
      fill="#FFFFFF"
      opacity="0.8"
    />

    {/* Dark Gray Cloud */}
    <path
      d="M20 18H8C5.79 18 4 16.21 4 14C4 11.96 5.51 10.28 7.51 10.04C8.22 8.14 10.05 6.8 12.2 6.8C14.74 6.8 16.83 8.62 17.31 11.06C17.94 10.64 18.69 10.4 19.5 10.4C21.71 10.4 23.5 12.19 23.5 14.4C23.5 14.92 23.4 15.42 23.22 15.87C24.61 16.21 25.6 17.44 25.6 18.91"
      fill="#475569"
      fillOpacity="0.65"
    />
  </svg>
);

const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle }) => {
  return (
    <button
      type="button"
      className={`theme-toggle-switch ${darkMode ? 'dark' : 'light'}`}
      onClick={onToggle}
      aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={darkMode ? 'Modo claro' : 'Modo oscuro'}
    >
      <div className="theme-toggle-track">
        {/* Background elements: Sky clouds in Light Mode, Dark clouds & stars in Dark Mode */}
        {darkMode ? <DarkNightBg /> : <LightClouds />}

        <div className="theme-toggle-thumb">
          {darkMode ? (
            <Moon size={15} className="theme-toggle-icon moon" />
          ) : (
            <Sun size={15} className="theme-toggle-icon sun" />
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
