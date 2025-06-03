import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { BookingEntry, Application } from '../types/types';

const allColumns = [
  { key: 'booking_date', label: 'Datum' },
  { key: 'comment', label: 'Verwendungszweck' },
  { key: 'amount', label: 'Betrag (€)' },
  { key: 'type', label: 'Typ' },
  { key: 'applicant', label: 'Antragsteller' },
  { key: 'funding_group', label: 'Veranstaltung' },
  { key: 'balance_before', label: 'Kontostand vorher' },
  { key: 'balance_after', label: 'Kontostand nachher' },
  { key: 'created_at', label: 'Erstellt am' },
];

type NewCashEntry = {
  booking_date?: string;
  comment?: string;
  amount?: string | number;
  application?: number | null;
  funding_group?: number | null;
};

export default function CashbookPage() {
  const [entries, setEntries] = useState<BookingEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('booking_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [minAmount, setMinAmount] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [newEntry, setNewEntry] = useState<NewCashEntry>({});
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [entryMode, setEntryMode] = useState<'manual' | 'from_application'>('manual');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const [expenseRes, incomeRes, appsRes] = await Promise.all([
          api.get<Omit<BookingEntry, 'type'>[]>('cashexpenseentries/'),
          api.get<Omit<BookingEntry, 'type'>[]>('cashincomeentries/'),
          api.get<Application[]>('applications/available-for-cashbook/'),
        ]);

        const expenses = expenseRes.data.map(entry => ({ ...entry, type: 'expense' as const }));
        const incomes = incomeRes.data.map(entry => ({ ...entry, type: 'income' as const }));

        setApplications(appsRes.data);
        setEntries([...expenses, ...incomes]);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  useEffect(() => {
    let result = [...entries];

    if (search.trim()) {
      result = result.filter(e =>
        e.comment?.toLowerCase().includes(search.toLowerCase()) ||
        e.application?.account_holder?.toLowerCase().includes(search.toLowerCase()) ||
        e.funding_group?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minAmount) {
      result = result.filter(e => parseFloat(e.amount as any) >= parseFloat(minAmount));
    }

    if (fromDate) {
      result = result.filter(e => new Date(e.booking_date) >= new Date(fromDate));
    }

    result.sort((a, b) => {
      const aVal = a[sortKey as keyof BookingEntry] ?? '';
      const bVal = b[sortKey as keyof BookingEntry] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      } else {
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
    });

    setFilteredEntries(result);
  }, [search, entries, sortKey, sortDirection, minAmount, fromDate]);

  const handleNewEntryChange = (field: keyof NewCashEntry, value: any) => {
    setNewEntry((prev: NewCashEntry) => ({ ...prev, [field]: value }));
  };

  const handleApplicationSelect = (appId: number | '') => {
    if (appId === '') {
      setSelectedApplication(null);
      setNewEntry(prev => ({ ...prev, application: null, comment: '', amount: '', funding_group: null }));
      return;
    }

    const app = applications.find(a => a.id === Number(appId));
    if (app) {
      setSelectedApplication(app);
      setNewEntry({
        application: app.id,
        comment: app.comment,
        amount: app.items?.reduce((sum, i) => sum + parseFloat(i.amount), 0) ?? '',
        booking_date: '',
        funding_group: app.items?.[0]?.funding_group?.id ?? null,
      });
    }
  };

  const handleDelete = async (entry: BookingEntry) => {
    if (!window.confirm('Wirklich löschen?')) return;

    try {
      const endpoint =
        entry.type === 'income'
          ? `cashincomeentries/${entry.id}/`
          : `cashexpenseentries/${entry.id}/`;

      await api.delete(endpoint);
      setEntries(prev => prev.filter(e => !(e.id === entry.id && e.type === entry.type)));
    } catch (err) {
      alert('Fehler beim Löschen');
      console.error(err);
    }
  };

  const submitNewEntry = async () => {
    try {
      const res = await api.post('cashexpenseentries/', newEntry);
      setEntries(prev => [...prev, { ...res.data, type: 'expense' }]);
      setNewEntry({});
      setSelectedApplication(null);
    } catch (err: any) {
      console.error('Fehler beim Anlegen:', err);
      alert('Fehler beim Anlegen:\n' + JSON.stringify(err.response?.data || err));
    }
  };

  const renderCell = (entry: BookingEntry, key: string) => {
    switch (key) {
      case 'booking_date':
        return new Date(entry.booking_date).toLocaleDateString();
      case 'comment':
        return entry.comment;
      case 'amount':
        return (
          <span className={parseFloat(entry.amount as any) >= 0 ? 'text-success' : 'text-danger'}>
            {parseFloat(entry.amount as any).toFixed(2)} €
          </span>
        );
      case 'type':
        return entry.type === 'income' ? 'Einnahme' : 'Ausgabe';
      case 'applicant':
        return entry.application?.account_holder ?? '-';
      case 'funding_group':
        return entry.funding_group?.name ?? '-';
      case 'balance_before':
        return entry.balance_before != null
          ? `${Number(entry.balance_before).toFixed(2)} €`
          : '-';
      case 'balance_after':
        return entry.balance_after != null
          ? `${Number(entry.balance_after).toFixed(2)} €`
          : '-';
      case 'created_at':
        return new Date(entry.created_at).toLocaleString();
      default:
        return '';
    }
  };

  if (loading) return <div>Lade Kassenbucheinträge…</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">📚 Kassenbuch Einträge</h2>

      <div className="row mb-3">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Suche…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="Min. Betrag"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
          >
            {allColumns.map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? '⬆️ Aufsteigend' : '⬇️ Absteigend'}
          </button>
        </div>
      </div>

      <div className="btn-group mb-3" role="group">
        <input type="radio" className="btn-check" name="entryMode" id="manualMode" checked={entryMode === 'manual'} onChange={() => setEntryMode('manual')} />
        <label className="btn btn-outline-primary" htmlFor="manualMode">Manueller Eintrag</label>
        <input type="radio" className="btn-check" name="entryMode" id="fromAppMode" checked={entryMode === 'from_application'} onChange={() => setEntryMode('from_application')} />
        <label className="btn btn-outline-primary" htmlFor="fromAppMode">Aus Antrag übernehmen</label>
      </div>

      {entryMode === 'manual' && (
        <div className="row mb-4">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Kommentar" value={newEntry.comment || ''} onChange={e => handleNewEntryChange('comment', e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Betrag" value={newEntry.amount || ''} onChange={e => handleNewEntryChange('amount', e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control" value={newEntry.booking_date || ''} onChange={e => handleNewEntryChange('booking_date', e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-success w-100" onClick={submitNewEntry}>Speichern</button>
          </div>
        </div>
      )}

      {entryMode === 'from_application' && (
        <div className="row mb-4">
          <div className="col-md-4">
            <select className="form-select" value={newEntry.application ?? ''} onChange={e => handleApplicationSelect(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">Antrag auswählen…</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.applicant.first_name} {app.applicant.last_name} – {app.items?.reduce((sum, i) => sum + parseFloat(i.amount), 0).toFixed(2)} € – {app.comment.slice(0, 40)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" value={newEntry.booking_date || ''} onChange={e => handleNewEntryChange('booking_date', e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-success w-100" onClick={submitNewEntry}>Speichern</button>
          </div>
        </div>
      )}

      <table className="table table-striped table-hover">
        <thead>
          <tr>
            {allColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(entry => (
            <tr key={`${entry.type}-${entry.id}`}>
              {allColumns.map(col => (
                <td key={col.key}>{renderCell(entry, col.key)}</td>
              ))}
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(entry)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
