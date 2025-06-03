// src/pages/ApplicationDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { Application, ApplicationItem } from '../types/types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    api.get<Application>(`applications/${id}/`).then(res => setApplication(res.data));
  }, [id]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ausgezahlt: 'success',
      genehmigt: 'primary',
      abgelehnt: 'danger',
      entscheidung_ausstehend: 'warning',
    };
    return <span className={`badge bg-${map[status] || 'dark'}`}>{status.replace('_', ' ')}</span>;
  };

  if (!application) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Lade Antrag ...</div>
      </div>
    );
  }

  const total = application.items?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;

  return (
    <div className="container mt-5">
      <Link to="/list" className="btn btn-outline-secondary mb-3">← Zurück zur Liste</Link>

      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="card-title mb-3 d-flex justify-content-between align-items-center">
            {application.applicant.username}
            {getStatusBadge(application.status)}
          </h3>

          <div className="row mb-3">
            <div className="col-md-6">
              <p><strong>IBAN:</strong> {application.iban}</p>
              <p><strong>Kontoinhaber:</strong> {application.account_holder}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Zweck der Auslage:</strong> {application.comment}</p>
              <p><strong>Eingereicht am:</strong> {new Date(application.submitted_at).toLocaleDateString()}</p>
            </div>
          </div>

          <hr />
          <h5>Belege & Positionen</h5>
          {application.items && application.items.length > 0 ? (
            <ul className="list-group">
              {application.items.map((item: ApplicationItem, idx: number) => (
                <li key={idx} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">
                        Pos. {item.position_number || '-'}: {item.description}
                      </div>

                      {item.funding_group ? (
                        <div className="small text-muted mt-1">
                          <strong>Veranstaltung:</strong>{' '}
                          {item.funding_group.name} {item.funding_group.date ? `(${item.funding_group.date})` : ''}
                        </div>
                      ) : (
                        <div className="small text-muted mt-1">Keine Veranstaltung zugeordnet</div>
                      )}

                      <div className="small text-muted mt-1">
                        {item.budget_entry ? (
                          <>Kategorie: {item.budget_entry.category}</>
                        ) : (
                          <>Keine Budget-Kategorie zugeordnet</>
                        )}
                      </div>

                      <div className="small text-muted">
                        Beleg:{' '}
                        {item.receipt_file ? (
                          <a href={item.receipt_file} target="_blank" rel="noopener noreferrer">
                            ansehen
                          </a>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div className="fs-5 fw-semibold">{parseFloat(item.amount).toFixed(2)} €</div>
                  </div>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between">
                <strong>Gesamtsumme</strong>
                <strong>{total.toFixed(2)} €</strong>
              </li>
            </ul>
          ) : (
            <div className="alert alert-info mt-3">Keine Positionen eingetragen.</div>
          )}
        </div>
      </div>
    </div>
  );
}
