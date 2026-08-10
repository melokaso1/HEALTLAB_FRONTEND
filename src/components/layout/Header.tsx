import { Moon, Sun } from 'lucide-react';
import healtlabIcon from '../../assets/icons/HEALTLAB_sintitulo.png';
import healtlabTitle from '../../assets/icons/HEALTLAB_Titulo.png';
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
          src={healtlabIcon}
          alt="HEALTLAB icono"
          className="header__logo-icon"
        />
        <img
          src={healtlabTitle}
          alt="HEALTLAB"
          className="header__logo-title"
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
