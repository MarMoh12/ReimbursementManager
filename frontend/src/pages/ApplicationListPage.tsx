import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Application } from '../types/types';
import ApplicationItem from '../components/ApplicationItem';
import { useAuth } from '../AuthContext';
import Select from 'react-select';

export default function ApplicationListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filtered, setFiltered] = useState<Application[]>([]);
  const { user } = useAuth();

  // Filter-Zustände
  const [searchName, setSearchName] = useState('');
  const [searchComment, setSearchComment] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFundingGroups, setselectedFundingGroups] = useState<string[]>([]);
  const [applicants, setApplicants] = useState<string[]>([]);
  const [fundingGroups, setFundingGroups] = useState<string[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = () => {
    const endpoint = user?.role === 'user' ? 'applications/mine/' : 'applications/';
    api.get<Application[]>(endpoint)
      .then(res => {
        const sorted = res.data.sort((a, b) =>
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
        setApplications(sorted);
        setFiltered(sorted);

        const names = Array.from(new Set(
          res.data.map(app =>
            `${app.applicant.first_name ?? ''} ${app.applicant.last_name ?? ''}`.trim()
          )
        ));
        setApplicants(names);

        const fundingGroupNames = new Set<string>();

        res.data.forEach(app => {
          const isOwnApplication = user?.role === 'admin' || user?.role === 'superuser' || app.applicant.id === user?.id;
          if (!isOwnApplication) return;

          app.items?.forEach(item => {
            if (item.funding_group?.name) {
              fundingGroupNames.add(item.funding_group.name);
            }
          });
        });

        setFundingGroups(Array.from(fundingGroupNames));
      }).catch(err => {
        console.error("Fehler beim Laden der Anträge", err);
      });
  };


  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bist du sicher, dass du diesen Antrag löschen möchtest?");
    if (!confirmed) return;

    try {
      await api.delete(`applications/${id}/`);
      const updated = applications.filter(app => app.id !== id);
      setApplications(updated);
      setFiltered(updated);
    } catch (error) {
      alert("Fehler beim Löschen des Antrags");
      console.error(error);
    }
  };

  const handleFilter = () => {
    let result = [...applications];

    if (searchName.trim()) {
      result = result.filter(app => {
        const fullName = `${app.applicant.first_name ?? ''} ${app.applicant.last_name ?? ''}`.toLowerCase();
        return fullName.includes(searchName.toLowerCase());
      });
    }

    if (searchComment) {
      result = result.filter(app =>
        (app.comment ?? '').toLowerCase().includes(searchComment.toLowerCase())
      );
    }

    if (amountMin) {
      const min = parseFloat(amountMin);
      result = result.filter(app => {
        const total = app.items?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
        return total >= min;
      });
    }

    if (amountMax) {
      const max = parseFloat(amountMax);
      result = result.filter(app => {
        const total = app.items?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
        return total <= max;
      });
    }

    if (searchStatus) {
      result = result.filter(app =>
        app.status.toLowerCase().includes(searchStatus.toLowerCase())
      );
    }

    if (startDate) {
      result = result.filter(app =>
        new Date(app.submitted_at) >= new Date(startDate)
      );
    }

    if (endDate) {
      result = result.filter(app =>
        new Date(app.submitted_at) <= new Date(endDate)
      );
    }

    if (selectedFundingGroups.length > 0) {
      result = result.filter(app =>
        app.items?.some(item =>
          item.funding_group &&
          selectedFundingGroups.includes(item.funding_group.name)
        )
      );
    }

    setFiltered(result);
  };

  const resetFilter = () => {
    setSearchName('');
    setSearchComment('');
    setAmountMin('');
    setAmountMax('');
    setSearchStatus('');
    setStartDate('');
    setEndDate('');
    setselectedFundingGroups([]);
    setFiltered(applications);
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">🔍 Filter</h5>
          <div className="row gy-2 gx-3 align-items-end">
            {user?.role !== 'user' && (
              <div className="col-md-3">
                <label className="form-label">Einreicher</label>
                <select
                  className="form-select"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                >
                  <option value="">Alle</option>
                  {applicants.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-md-3">
              <label className="form-label">Zweck</label>
              <input
                type="text"
                className="form-control"
                value={searchComment}
                onChange={(e) => setSearchComment(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Betrag von</label>
              <input
                type="number"
                className="form-control"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Betrag bis</label>
              <input
                type="number"
                className="form-control"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
              >
                <option value="">Alle</option>
                <option value="ausgezahlt">Ausgezahlt</option>
                <option value="genehmigt">Genehmigt</option>
                <option value="entscheidung_ausstehend">Entscheidung ausstehend</option>
                <option value="abgelehnt">Abgelehnt</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Von</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Bis</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Mittelverwendungsgruppen</label>
              <Select
                isMulti
                options={fundingGroups.map(fundingGroup => ({ value: fundingGroup, label: fundingGroup }))}
                value={selectedFundingGroups.map(ev => ({ value: ev, label: ev }))}
                onChange={(selectedOptions) => {
                  setselectedFundingGroups(selectedOptions.map(option => option.value));
                }}
              />
            </div>

            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-primary w-100" onClick={handleFilter}>Anwenden</button>
              <button className="btn btn-outline-secondary w-100" onClick={resetFilter}>Zurücksetzen</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="card-title mb-4">Erstattungsanträge</h3>
          <div className="list-group">
            {filtered.length > 0 ? (
              filtered.map(app => (
                <ApplicationItem
                  key={app.id}
                  app={app}
                  onDelete={() => handleDelete(app.id)}
                  onStatusChange={(id, newStatus) => {
                    setApplications(prev =>
                      prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
                    );
                    setFiltered(prev =>
                      prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
                    );
                  }}
                />
              ))
            ) : (
              <div className="text-center text-muted py-4">
                Keine Anträge gefunden
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
