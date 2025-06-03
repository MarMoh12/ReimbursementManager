import React, { useState, useEffect } from 'react';
import api from '../api/api';

interface BudgetItem {
  id: number;
  category: string;
  amount: string;
}

interface IncomeEntry {
  id: number;
  source: string;
  amount: string;
  comment?: string;
  received_at?: string;
}

interface FundingGroup {
  id: number;
  name: string;
  date: string;
  budgets: BudgetItem[];
  income_entries?: IncomeEntry[];
}

export default function FundingGroupBudgetsPage() {
  const [fundingGroups, setFundingGroups] = useState<FundingGroup[]>([]);
  const [openFundingGroupIds, setOpenFundingGroupIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newFundingGroup, setNewFundingGroup] = useState<{ name: string; date: string }>({
    name: '',
    date: ''
  });
  const [newIncome, setNewIncome] = useState<{
    source: string;
    amount: string;
    received_at: string;
    comment?: string;
    fundingGroupId: number | '';
  }>({
    source: '',
    amount: '',
    received_at: '',
    comment: '',
    fundingGroupId: ''
  });
  const [newBudget, setNewBudget] = useState<{
    fundingGroupId: number | '';
    category: string;
    amount: string;
  }>({
    fundingGroupId: '',
    category: '',
    amount: ''
  });

  // Zustände für Sichtbarkeit der Hinzufügen-Formulare
  const [isNewFundingGroupVisible, setIsNewFundingGroupVisible] = useState(false);
  const [isNewIncomeVisible, setIsNewIncomeVisible] = useState(false);
  const [isNewBudgetVisible, setIsNewBudgetVisible] = useState(false);

  useEffect(() => {
    fetchFundingGroups();
  }, []);

  const fetchFundingGroups = () => {
    api.get<FundingGroup[]>('fundinggroups/').then(res => setFundingGroups(res.data));
  };

  const toggleFundingGroup = (fundingGroupId: number) => {
    setOpenFundingGroupIds(prev =>
      prev.includes(fundingGroupId) ? prev.filter(id => id !== fundingGroupId) : [...prev, fundingGroupId]
    );
  };

  const handleAddFundingGroup = async () => {
    const { name, date } = newFundingGroup;
    if (!name) return alert('Bitte einen Namen angeben');

    try {
      await api.post('fundinggroups/', { name, ...(date && { date }) });
      setNewFundingGroup({ name: '', date: '' });
      fetchFundingGroups();
    } catch (err: any) {
      console.error('❌ Fehler beim FundingGroup-POST:', err.response?.data || err);
      alert('Fehler beim Hinzufügen der Mittelverwendungsgruppe');
    }
  };

  const handleAddGlobalBudget = async () => {
    if (!newBudget.fundingGroupId || !newBudget.category || !newBudget.amount) {
      alert('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      await api.post('budgetentries/', {
        funding_group: newBudget.fundingGroupId,
        category: newBudget.category,
        amount: parseFloat(newBudget.amount)
      });
      setNewBudget({ fundingGroupId: '', category: '', amount: '' });
      fetchFundingGroups();
    } catch (err) {
      console.error('❌ Fehler beim Budget hinzufügen:', err);
      alert('Fehler beim Hinzufügen des Budgeteintrags');
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.source || !newIncome.amount || !newIncome.fundingGroupId) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const fundingGroup = fundingGroups.find(e => e.id === newIncome.fundingGroupId);
    if (!fundingGroup) {
      alert('Ungültige Mittelverwendungsgruppe');
      return;
    }

    const payload = {
      funding_group: newIncome.fundingGroupId,
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      received_at: newIncome.received_at || fundingGroup.date,
      comment: newIncome.comment || ''
    };

    try {
      await api.post('incomeentries/', payload);
      fetchFundingGroups();
      setNewIncome({ source: '', amount: '', received_at: '', comment: '', fundingGroupId: '' });
    } catch (err) {
      console.error('❌ Fehler beim Einnahme-POST:', err);
      alert('Fehler beim Hinzufügen der Einnahme');
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    if (!window.confirm('Diesen Budgeteintrag wirklich löschen?')) return;
    try {
      await api.delete(`budgetsentries${budgetId}/`);
      fetchFundingGroups();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    }
  };

  const handleDeleteIncome = async (incomeId: number) => {
    if (!window.confirm('Diese Einnahme wirklich löschen?')) return;
    try {
      await api.delete(`incomeentries/${incomeId}/`);
      fetchFundingGroups();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen der Einnahme');
    }
  };

  const handleDeleteFundingGroup = async (fundingGroupId: number) => {
    const fundingGroup = fundingGroups.find(fg => fg.id === fundingGroupId);
    const label = fundingGroup ? `${fundingGroup.name} (${fundingGroup.date})` : 'diese Mittelverwendungsgruppe';

    if (!window.confirm(`Willst du ${label} wirklich löschen? Alle zugehörigen Budgets und Einnahmen werden entfernt.`)) return;

    try {
      await api.delete(`fundinggroups/${fundingGroupId}/`);
      fetchFundingGroups();
    } catch (err) {
      alert('Fehler beim Löschen der Mittelverwendungsgruppe');
    }
  };

  const filteredFundingGroups = fundingGroups.filter(fundingGroup => {
    const fundingGroupDate = new Date(fundingGroup.date);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    return (!from || fundingGroupDate >= from) && (!to || fundingGroupDate <= to);
  });

  const totalInRange = filteredFundingGroups.reduce(
    (sum, ev) => sum + ev.budgets.reduce((bSum, b) => bSum + parseFloat(b.amount), 0),
    0
  );

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">💰 Budgetübersicht aller Mittelverwendungsgruppen</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Von</label>
          <input
            type="date"
            className="form-control shadow-sm"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Bis</label>
          <input
            type="date"
            className="form-control shadow-sm"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <div className="w-100 bg-success-subtle border rounded p-3 text-center shadow-sm">
            <div className="text-muted small">Gesamtbudget im Zeitraum</div>
            <div className="fs-4 fw-bold text-success">{totalInRange.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <hr className="my-5" />

      {/* Neuer Mittelverwendungsgruppe */}
      <h5 className="mb-3" onClick={() => setIsNewFundingGroupVisible(!isNewFundingGroupVisible)}>
        ➕ Neue Mittelverwendungsgruppe
      </h5>
      {isNewFundingGroupVisible && (
        <div className="row g-3 align-items-end mb-5">
          <div className="col-md-5">
            <label className="form-label">Bezeichnung</label>
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="z.B. Sommerfest"
              value={newFundingGroup.name}
              onChange={e => setNewFundingGroup(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Datum</label>
            <input
              type="date"
              className="form-control shadow-sm"
              value={newFundingGroup.date}
              onChange={e => setNewFundingGroup(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="col-md-3 d-grid">
            <button className="btn btn-primary shadow-sm" onClick={handleAddFundingGroup}>
              Mittelverwendungsgruppe anlegen
            </button>
          </div>
        </div>
      )}

      {/* Neue Einnahme */}
      <h5 className="mb-3" onClick={() => setIsNewIncomeVisible(!isNewIncomeVisible)}>
        ➕ Neue Einnahme hinzufügen
      </h5>
      {isNewIncomeVisible && (
        <div className="row g-3 align-items-end mb-5">
          <div className="col-md-3">
            <label className="form-label">Mittelverwendungsgruppe</label>
            <select
              className="form-select shadow-sm"
              value={newIncome.fundingGroupId}
              onChange={e =>
                setNewIncome(prev => ({
                  ...prev,
                  fundingGroupId: e.target.value === '' ? '' : parseInt(e.target.value)
                }))
              }
            >
              <option value="">Mittelverwendungsgruppe wählen</option>
              {fundingGroups.map(fundingGroup => (
                <option key={fundingGroup.id} value={fundingGroup.id}>
                  {fundingGroup.name} ({fundingGroup.date})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Quelle</label>
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="z.B. Spende"
              value={newIncome.source}
              onChange={e => setNewIncome(prev => ({ ...prev, source: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Betrag (€)</label>
            <input
              type="number"
              className="form-control shadow-sm"
              placeholder="0.00"
              value={newIncome.amount}
              onChange={e => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Erhalten am</label>
            <input
              type="date"
              className="form-control shadow-sm"
              value={newIncome.received_at}
              onChange={e => setNewIncome(prev => ({ ...prev, received_at: e.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Kommentar</label>
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="Optional"
              value={newIncome.comment}
              onChange={e => setNewIncome(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-outline-success shadow-sm" onClick={handleAddIncome}>
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Neues Budget */}
      <h5 className="mb-3" onClick={() => setIsNewBudgetVisible(!isNewBudgetVisible)}>
        ➕ Neues Budget hinzufügen
      </h5>
      {isNewBudgetVisible && (
        <div className="row g-3 align-items-end mb-5">
          <div className="col-md-4">
            <label className="form-label">Mittelverwendungsgruppe</label>
            <select
              className="form-select shadow-sm"
              value={newBudget.fundingGroupId}
              onChange={e =>
                setNewBudget(prev => ({
                  ...prev,
                  fundingGroupId: e.target.value === '' ? '' : parseInt(e.target.value)
                }))
              }
            >
              <option value="">Mittelverwendungsgruppe wählen</option>
              {fundingGroups.map(fundingGroup => (
                <option key={fundingGroup.id} value={fundingGroup.id}>
                  {fundingGroup.name} ({fundingGroup.date})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Kategorie</label>
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="z.B. Deko"
              value={newBudget.category}
              onChange={e => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Betrag (€)</label>
            <input
              type="number"
              className="form-control shadow-sm"
              placeholder="0.00"
              value={newBudget.amount}
              onChange={e => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-outline-primary shadow-sm" onClick={handleAddGlobalBudget}>
              Speichern
            </button>
          </div>
        </div>
      )}

      <hr className="my-5" />

      {/* FundingGroup Cards */}
      {filteredFundingGroups.map(fundingGroup => {
        const isOpen = openFundingGroupIds.includes(fundingGroup.id);
        const totalBudget = fundingGroup.budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const incomeEntries = fundingGroup.income_entries ?? [];
        const totalIncome = incomeEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const saldo = totalIncome - totalBudget;

        return (
          <div key={fundingGroup.id} className="card mb-4 shadow-sm">
          <div className="card-header d-flex flex-wrap justify-content-between align-items-center bg-light">
            <div
              className="flex-grow-1"
              onClick={() => toggleFundingGroup(fundingGroup.id)}
              style={{ cursor: 'pointer' }}
            >
            <strong>
              {fundingGroup.name}
              {fundingGroup.date ? ` (${fundingGroup.date})` : ''}
            </strong>
            </div>
            <div className="d-flex flex-wrap justify-content-end align-items-center ms-3 gap-2">
              <span className="badge bg-secondary">
                Budget: {totalBudget.toFixed(2)} €
              </span>
              <span className="badge bg-success">
                Einnahmen: {totalIncome.toFixed(2)} €
              </span>
              <span className={`badge ${saldo >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                Saldo: {saldo.toFixed(2)} €
              </span>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFundingGroup(fundingGroup.id);
                }}
                title="Mittelverwendungsgruppe löschen"
              >
                🗑
              </button>
            </div>
          </div>

            {isOpen && (
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Budgeteinträge</h6>
                {fundingGroup.budgets.length === 0 ? (
                  <div className="text-muted mb-3">Keine Budgeteinträge vorhanden.</div>
                ) : (
                  <ul className="list-group mb-4">
                    {fundingGroup.budgets.map(budget => (
                      <li
                        key={budget.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <span>{budget.category}</span>
                        <span>
                          {parseFloat(budget.amount).toFixed(2)} €
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            🗑
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <h6 className="fw-semibold mb-3">Einnahmen</h6>
                {incomeEntries.length === 0 ? (
                  <div className="text-muted">Keine Einnahmen vorhanden.</div>
                ) : (
                  <ul className="list-group">
                    {incomeEntries.map(income => (
                      <li
                        key={income.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{income.source}</strong>
                          <div className="text-muted small">
                            {income.received_at}{' '}
                            {income.comment && `– ${income.comment}`}
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold text-success me-2">
                            +{parseFloat(income.amount).toFixed(2)} €
                          </span>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteIncome(income.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
