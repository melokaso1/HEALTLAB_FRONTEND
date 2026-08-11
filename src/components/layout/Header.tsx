import React from 'react';
import healtlabLogo from '../../assets/icons/HEALTLAB.png';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header__logo">
        <img
          src={healtlabLogo}
          alt="HEALTLAB Logo"
          className="header__logo-img"
        />
      </div>
    </header>
  );
};

export default Header;
