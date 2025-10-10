import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

// Импортируем твои иконки из папки assets
import profileIcon from '../assets/профиль.png';
import authorsIcon from '../assets/авторы.png';
import contentIcon from '../assets/контент.png';
import ideasIcon from '../assets/идеи.png';
import favoritesIcon from '../assets/избраные.png';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/profile" title="Профиль">
        <img src={profileIcon} alt="Профиль" />
      </NavLink>
      <NavLink to="/authors" title="Авторы">
        <img src={authorsIcon} alt="Авторы" />
      </NavLink>
      <NavLink to="/content" title="Контент">
        <img src={contentIcon} alt="Контент" />
      </NavLink>
      <NavLink to="/ideas" title="Идеи">
        <img src={ideasIcon} alt="Идеи" />
      </NavLink>
      <NavLink to="/izbrannoe" title="Избранное">
        <img src={favoritesIcon} alt="Избранное" />
      </NavLink>
    </nav>
  );
}

export default BottomNav;