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
import 'bootstrap/dist/css/bootstrap.min.css';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ❗ Header nur anzeigen, wenn eingeloggt
  if (!isAuthenticated) return null;

  const role = user?.role;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
      <Link className="navbar-brand d-flex align-items-center" to="/">
        <img src="/images/Wappen.svg" alt="Wappen" width="48" height="48" />
      </Link>
      <div className="collapse navbar-collapse justify-content-between">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link className="nav-link d-flex align-items-center" to="/">
              <House className="me-1" /> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link d-flex align-items-center" to="/list">
              <Speedometer2 className="me-1" /> Anträge
            </Link>
          </li>

          {(role === 'admin' || role === 'superuser') && (
            <>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/budgets">
                  <CardChecklist className="me-1" /> Budgets
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/comparison">
                  <Grid3x3Gap className="me-1" /> Vergleich
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center" to="/cashbook">
                  <Grid3x3Gap className="me-1" /> Kassenbuch
                </Link>
              </li>
            </>
          )}
        </ul>
        <div className="d-flex">
          <button className="btn btn-outline-light d-flex align-items-center" onClick={handleLogout}>
            <BoxArrowRight className="me-1" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
