import React, { useState } from 'react';
import { Application } from '../types/types';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface Props {
  app: Application;
  onDelete?: () => void;
  onStatusChange?: (id: number, newStatus: string) => void;
  canEditStatus?: boolean;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    ausgezahlt: 'success',
    genehmigt: 'primary',
    abgelehnt: 'danger',
    entscheidung_ausstehend: 'warning',
  };
  return <span className={`badge bg-${map[status] || 'dark'}`}>{status.replace('_', ' ')}</span>;
}

export default function ApplicationItem({ app, onDelete, onStatusChange, canEditStatus }: Props) {
  const [isItemsVisible, setIsItemsVisible] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  console.log(app)

  const items = app.items || [];
  const total = items.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const toggleItemsVisibility = () => setIsItemsVisible(!isItemsVisible);

  const handleStatusUpdate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);
    try {
      await api.patch(`applications/${app.id}/`, { status: newStatus });
      onStatusChange?.(app.id, newStatus);
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err);
      alert('Fehler beim Aktualisieren des Status');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <span className="fw-semibold me-3">Einreicher:</span>
          {app.applicant.first_name && app.applicant.last_name
            ? `${app.applicant.first_name} ${app.applicant.last_name}`
            : app.applicant.username}
          <span className="fw-semibold ms-4 me-2">Kontoinhaber:</span>
          {app.account_holder}
        </div>
        <Link to={`/applications/${app.id}`} className="btn btn-sm btn-outline-primary">
          Details
        </Link>
        <div>
          {items.length > 0 && (
            <button
              className="btn btn-link btn-sm"
              onClick={toggleItemsVisibility}
              style={{ padding: '0', color: '#007bff', fontWeight: 'bold' }}
            >
              {isItemsVisible ? 'Positionen ausblenden' : 'Positionen anzeigen'}
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span><strong>Status:</strong> {getStatusBadge(app.status)}</span>
          {canEditStatus && (
            <select
              className="form-select form-select-sm w-auto"
              value={app.status}
              onChange={handleStatusUpdate}
              disabled={statusUpdating}
            >
              <option value="ausgezahlt">Ausgezahlt</option>
              <option value="genehmigt">Genehmigt</option>
              <option value="entscheidung_ausstehend">Entscheidung ausstehend</option>
              <option value="abgelehnt">Abgelehnt</option>
            </select>
          )}
        </div>

        <p><strong>Zweck:</strong> {app.comment}</p>
        <p><strong>Eingereicht am:</strong> {new Date(app.submitted_at).toLocaleDateString()}</p>
        <p><strong>Betrag (gesamt):</strong> {items.length > 0 ? `${total.toFixed(2)} €` : '–'}</p>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            title="AC-Beschlusstext kopieren"
            onClick={() => {
              const text = `Der hohe AC möge beschließen Bbr. ${app.applicant.username.split(' ').slice(-1)[0]} die Kosten i.H.v. ${total.toFixed(2)}€ für Anschaffungen.`;
              navigator.clipboard.writeText(text).then(() => {
                alert('Text wurde in die Zwischenablage kopiert!');
              });
            }}
          >
            📝
          </button>
          {onDelete && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={onDelete}
              title="Antrag löschen"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isItemsVisible && items.length > 0 && (
        <div className="card-body p-0">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Pos.-Nr.</th>
                <th>Beschreibung</th>
                <th>Betrag (€)</th>
                <th>Beleg</th>
                <th>Kategorie</th>
                <th>Veranstaltung</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.position_number}</td>
                  <td>{item.description}</td>
                  <td>{parseFloat(item.amount).toFixed(2)} €</td>
                  <td>
                    {item.receipt_file ? (
                      <a href={item.receipt_file} target="_blank" rel="noopener noreferrer">
                        ansehen
                      </a>
                    ) : '–'}
                  </td>
                  <td>{item.budget_entry?.category || '–'}</td>
                  <td>
                    {item.funding_group
                      ? `${item.funding_group.name}${item.funding_group.date ? ` (${item.funding_group.date})` : ''}`
                      : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
