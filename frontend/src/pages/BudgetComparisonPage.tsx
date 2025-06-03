import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Application, ApplicationItem, FundingGroup } from '../types/types';

interface IncomeEntry {
  id: number;
  source: string;
  amount: string;
  comment?: string;
  received_at?: string;
}

export default function BudgetComparisonPage() {
  const [fundingGroups, setFundingGroups] = useState<(FundingGroup & { income_entries?: IncomeEntry[] })[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [openFundingGroupIds, setOpenFundingGroupIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openStatusSections, setOpenStatusSections] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleStatusSection = (status: string) => {
    setOpenStatusSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

useEffect(() => {
  const fetchData = async () => {
    const fundingGroupsRes = await api.get<(FundingGroup & { income_entries?: IncomeEntry[] })[]>('fundinggroups/');
    const appsRes = await api.get<Application[]>('applications/');

    const fundingGroups = fundingGroupsRes.data;
    const apps = appsRes.data;

    // Statusbereiche initial öffnen
    const initialStatusState: Record<string, boolean> = {};
    const statuses = ['ausgezahlt', 'genehmigt', 'entscheidung_ausstehend', 'abgelehnt'];

    fundingGroups.forEach(fg => {
      statuses.forEach(status => {
        initialStatusState[`${fg.id}_${status}`] = true;
      });
    });

    setFundingGroups(fundingGroups);
    setApplications(apps);
    setOpenStatusSections(initialStatusState);
  };

  fetchData();
}, []);


  const toggleFundingGroup = (fundingGroupId: number) => {
    setOpenFundingGroupIds(prev =>
      prev.includes(fundingGroupId) ? prev.filter(id => id !== fundingGroupId) : [...prev, fundingGroupId]
    );
  };

  const filteredFundingGroups = fundingGroups
    .filter(fg => {
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      if (!from && !to) return true;
      if (!fg.date) return false;
      const fundingGroupDate = new Date(fg.date);
      return (!from || fundingGroupDate >= from) && (!to || fundingGroupDate <= to);
    })
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const getAllItems = () =>
    applications.flatMap(app =>
      (app.items ?? []).map(item => ({
        ...item,
        applicant_name: `${app.applicant.first_name} ${app.applicant.last_name}`,
        application_status: app.status,
        funding_group_id: item.funding_group?.id ?? null,
      }))
    );
  const allItems = getAllItems();

  const totalGeplantInRange = filteredFundingGroups.reduce((acc, ev) => {
    const budgets = ev.budgets ?? [];
    return acc + budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  }, 0);

  const totalIstInRange = filteredFundingGroups.reduce((acc, ev) => {
    const items = allItems.filter(
      item => item.funding_group_id === ev.id && ['ausgezahlt', 'genehmigt'].includes(item.application_status ?? '')
    );
    return acc + items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }, 0);

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">📊 Geplant-Ist-Vergleich nach Mittelverwendungsgruppe</h2>

      <div className="row g-3 mb-4 bg-white sticky-top pt-3 pb-2 border-bottom" style={{ top: '70px', zIndex: 10 }}>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Zeitraum: Von</label>
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
        <div className="col-md-2 d-flex align-items-end">
          <div className="w-100 bg-light border rounded p-3 text-center shadow-sm">
            <div className="text-muted small">Ist im Zeitraum</div>
            <div className="fs-5 fw-bold text-success">{totalIstInRange.toFixed(2)} €</div>
          </div>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <div className="w-100 bg-light border rounded p-3 text-center shadow-sm">
            <div className="text-muted small">Geplant im Zeitraum</div>
            <div className="fs-5 fw-bold text-primary">{totalGeplantInRange.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <hr className="my-4" />
      <h4 className="text-center mb-4">📅 Mittelverwendungsgruppen</h4>

      {filteredFundingGroups.map(fundingGroup => {
        const isOpen = openFundingGroupIds.includes(fundingGroup.id);
        const budgets = fundingGroup.budgets ?? [];
        const incomeEntries = fundingGroup.income_entries ?? [];

        const matchingItems = allItems.filter(item =>
          item.funding_group_id === fundingGroup.id &&
          ['ausgezahlt', 'genehmigt'].includes(item.application_status ?? '')
        );

        const budgetMap = new Map<number, {
          category: string;
          geplant: number;
          ist: number;
          items: ApplicationItem[];
        }>();

        budgets.forEach(b => {
          budgetMap.set(b.id, {
            category: b.category,
            geplant: parseFloat(b.amount),
            ist: 0,
            items: []
          });
        });

        const unassignedItems: ApplicationItem[] = [];

        matchingItems.forEach(item => {
          if (item.budget_entry && budgetMap.has(item.budget_entry.id)) {
            const entry = budgetMap.get(item.budget_entry.id)!;
            entry.ist += parseFloat(item.amount);
            entry.items.push(item);
          } else {
            unassignedItems.push(item);
          }
        });

        const totalGeplant = Array.from(budgetMap.values()).reduce((sum, b) => sum + b.geplant, 0);
        const totalIst = Array.from(budgetMap.values()).reduce((sum, b) => sum + b.ist, 0) +
          unassignedItems.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        const totalAusstehend = allItems
        .filter(item =>
          item.funding_group_id === fundingGroup.id &&
          item.application_status === 'entscheidung_ausstehend'
        )
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        const totalAbgelehnt = allItems
        .filter(item =>
          item.funding_group_id === fundingGroup.id &&
          item.application_status === 'abgelehnt'
        )
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

        const totalIncome = incomeEntries.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        const saldo = totalIncome - totalIst;

        return (
          <div key={fundingGroup.id} className="card mb-4 shadow-sm">
            <div
              className="card-header d-flex justify-content-between align-items-center bg-light"
              onClick={() => toggleFundingGroup(fundingGroup.id)}
              style={{ cursor: 'pointer' }}
            >
              <strong>
                {fundingGroup.name}
                {fundingGroup.date ? ` (${fundingGroup.date})` : ''}
              </strong>
              <div className="text-end">
                <span className="badge bg-success me-2">Ist: {totalIst.toFixed(2)} €</span>
                <span className="badge bg-warning text-dark me-2">Ausstehend: {totalAusstehend.toFixed(2)} €</span>
                <span className="badge bg-danger me-2">Abgelehnt: {totalAusstehend.toFixed(2)} €</span>
                <span className="badge bg-primary me-2">Geplant: {totalGeplant.toFixed(2)} €</span>
                <span className="badge bg-info me-2">Einnahmen: {totalIncome.toFixed(2)} €</span>
                <span className={`badge ${saldo >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  Saldo: {saldo.toFixed(2)} €
                </span>
              </div>
            </div>

            {isOpen && (
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Einnahmen</h6>
                {/* ... Einnahmen und Ausgaben ... */}

                <h6 className="fw-semibold mb-3">Anträge nach Status</h6>
                {['ausgezahlt', 'genehmigt', 'entscheidung_ausstehend', 'abgelehnt'].map(status => {
                  const statusApplications = applications.filter(app =>
                    (app.items ?? []).some(item => item.funding_group?.id === fundingGroup.id) && app.status === status
                  );

                  if (statusApplications.length === 0) return null;

                  const statusLabelMap: Record<string, string> = {
                    'ausgezahlt': '💸 Ausgezahlt',
                    'genehmigt': '✅ Genehmigt',
                    'entscheidung_ausstehend': '⏳ Entscheidung ausstehend',
                    'abgelehnt': '❌ Abgelehnt',
                  };

                  const isStatusOpen = openStatusSections[`${fundingGroup.id}_${status}`] ?? false;

                  return (
                    <div key={status} className="mb-4">
                      <button
                        className="btn btn-sm btn-outline-secondary mb-2"
                        onClick={() => toggleStatusSection(`${fundingGroup.id}_${status}`)}
                      >
                        {isStatusOpen ? '−' : '+'} {statusLabelMap[status]}
                      </button>
                      {isStatusOpen && (
                        <ul className="list-group">
                          {statusApplications.map(app => (
                            <li key={app.id} className="list-group-item">
                              <div className="fw-bold">{app.applicant.first_name} {app.applicant.last_name}</div>
                              <div className="small text-muted mb-2">{new Date(app.submitted_at).toLocaleDateString()}</div>
                              <ul className="mb-0 ms-3 small">
                                {(app.items ?? []).map(item => (
                                  <li key={item.id} className="d-flex justify-content-between">
                                    <div>
                                      <strong>{item.description}</strong><br />
                                      Betrag: {parseFloat(item.amount).toFixed(2)} €<br />
                                      Beleg:{' '}
                                      {item.receipt_file ? (
                                        <a href={item.receipt_file} target="_blank" rel="noopener noreferrer">ansehen</a>
                                      ) : '—'}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="my-5" />
    </div>
  );
}
