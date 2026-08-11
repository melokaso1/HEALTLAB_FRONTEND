import React from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle?: () => void;
}

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
