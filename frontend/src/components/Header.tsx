import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  House,
  Speedometer2,
  CardChecklist,
  Grid3x3Gap,
  BoxArrowRight
} from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false); // Menü nach Klick wieder einklappen
  };

  if (!isAuthenticated) return null;
  const role = user?.role;

  return (
    <nav
      className="navbar navbar-dark sticky-top px-4"
      style={{
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/" onClick={handleNavClick}>
          <img src="/images/Wappen.svg" alt="Wappen" width="48" height="48" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Navigation ein-/ausblenden"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`navbar-collapse ${isMenuOpen ? 'd-block' : 'd-none'} d-lg-flex justify-content-between`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/" onClick={handleNavClick}>
                <House className="me-1" /> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/list" onClick={handleNavClick}>
                <Speedometer2 className="me-1" /> Anträge
              </Link>
            </li>

            {(role === 'admin' || role === 'superuser') && (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/budgets" onClick={handleNavClick}>
                    <CardChecklist className="me-1" /> Budgets
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/comparison" onClick={handleNavClick}>
                    <Grid3x3Gap className="me-1" /> Vergleich
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/cashbook" onClick={handleNavClick}>
                    <Grid3x3Gap className="me-1" /> Kassenbuch
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex mt-3 mt-lg-0">
            <button className="btn btn-outline-light d-flex align-items-center" onClick={handleLogout}>
              <BoxArrowRight className="me-1" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
