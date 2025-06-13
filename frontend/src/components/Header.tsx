import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  House,
  Speedometer2,
  CardChecklist,
  Grid3x3Gap,
  BoxArrowRight
} from 'react-bootstrap-icons';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const role = user?.role;

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark sticky-top px-4"
      style={{
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <img src="/images/Wappen.svg" alt="Wappen" width="48" height="48" />
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarContent"
        aria-controls="navbarContent"
        aria-expanded="false"
        aria-label="Navigation ein-/ausblenden"
      >
        {/* weißes Icon über direktes SVG */}
        <span
          style={{
            display: 'inline-block',
            width: '1.5em',
            height: '1.5em',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='white' stroke-width='2' stroke-linecap='round' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E")`,
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </button>

      <div className="collapse navbar-collapse justify-content-between" id="navbarContent">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/">
              <House className="me-1" /> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/list">
              <Speedometer2 className="me-1" /> Anträge
            </Link>
          </li>

          {(role === 'admin' || role === 'superuser') && (
            <>
              <li className="nav-item">
                <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/budgets">
                  <CardChecklist className="me-1" /> Budgets
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/comparison">
                  <Grid3x3Gap className="me-1" /> Vergleich
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white fw-semibold d-flex align-items-center" to="/cashbook">
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
    </nav>
  );
};

export default Header;
