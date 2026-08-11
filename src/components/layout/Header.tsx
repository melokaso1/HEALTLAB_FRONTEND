import { Moon, Sun } from 'lucide-react';
import healtlabLogo from '../../assets/icons/HEALTLAB.png';
import './Header.css';

interface HeaderProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode = false, onToggleDarkMode }) => {
  return (
    <header className="header">
      <div className="header__logo">
        <img
          src={healtlabLogo}
          alt="HEALTLAB Logo"
          className="header__logo-img"
        />
      </div>

      <button
        type="button"
        className="header__theme-toggle"
        onClick={onToggleDarkMode}
        aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {darkMode ? (
          <Sun size={16} strokeWidth={2} />
        ) : (
          <Moon size={16} strokeWidth={2} />
        )}
        <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>
    </header>
  );
};

export default Header;
