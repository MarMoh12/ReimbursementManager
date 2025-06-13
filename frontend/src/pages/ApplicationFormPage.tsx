import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { FundingGroup } from '../types/types';
import { useAuth } from '../AuthContext';

interface ApplicationItem {
  position_number: string;
  description: string;
  amount: string;
  selectedFileName: string;
  budgetEntryId?: string;
  fundingGroupId?: string;
}

interface UserOption {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export default function ApplicationFormPage() {
  const { user } = useAuth();
  const [fundingGroups, setFundingGroups] = useState<FundingGroup[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    date: '',
    account_holder: '',
    iban: '',
    comment: ''
  });
  const [items, setItems] = useState<ApplicationItem[]>([]);

  useEffect(() => {
    api.get<FundingGroup[]>('fundinggroups/').then(res => {
      setFundingGroups(res.data);

      api.get('budgetentries/').then(entryRes => {
        setBudgetEntries(entryRes.data);
      });

      api.get<UserOption[]>('users/').then(res => {
        setUsers(res.data);

        // Immer den aktuellen Benutzer setzen – unabhängig von der Rolle
        setSelectedUserId(user?.id?.toString() || '');
      });

      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof ApplicationItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'fundingGroupId') newItems[index].budgetEntryId = '';
    setItems(newItems);
  };

  const addItem = () => {
    setItems(prevItems => [
      ...prevItems,
      {
        position_number: '',
        description: '',
        amount: '',
        selectedFileName: '',
        fundingGroupId: '',
        budgetEntryId: ''
      }
    ]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      account_holder: '',
      iban: '',
      comment: ''
    });
    setUploadedFiles([]);
    setItems([]);
    if (users.length > 0) setSelectedUserId(users[0].id.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((user?.role === 'admin' || user?.role === 'superuser') && !selectedUserId) {
      alert('Bitte einen Antragsteller auswählen.');
      return;
    }

    if (items.length === 0) {
      alert('Bitte mindestens eine Rechnungsposition hinzufügen.');
      return;
    }

    try {
      const payload: any = {
        iban: formData.iban,
        account_holder: formData.account_holder,
        comment: formData.comment
      };

      // Nur Admins dürfen applicant setzen
      if (user?.role === 'admin' || user?.role === 'superuser') {
        payload.applicant = selectedUserId;
      }

      const response = await api.post('applications/', payload);


      const applicationId = response.data.id;

      // 2. Alle Items einzeln hochladen
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const itemForm = new FormData();
        itemForm.append('application_id', applicationId);
        itemForm.append('position_number', item.position_number);
        itemForm.append('description', item.description);
        itemForm.append('amount', item.amount);

        if (item.fundingGroupId) itemForm.append('funding_group_id', item.fundingGroupId);
        if (item.budgetEntryId) itemForm.append('budget_entry_id', item.budgetEntryId);

        const file = uploadedFiles.find(f => f.name === item.selectedFileName);
        if (file) itemForm.append('receipt_file', file);

        await api.post('applicationitems/', itemForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('Antrag erfolgreich eingereicht!');
      resetForm();
    } catch (err: any) {
      alert('Fehler: ' + JSON.stringify(err.response?.data || err));
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: '90%' }}>
      <h2 className="mb-4 text-center">Auslagenerstattungsformular</h2>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm" encType="multipart/form-data">
        <h5 className="mb-3">Einreichender</h5>
        <div className="row mb-3">
          {user?.role === 'admin' || user?.role === 'superuser' ? (
            <>
              <div className="col-md-6">
                <label className="form-label">Antragsteller</label>
                <select
                  className="form-select"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name || u.username} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Datum</label>
                <input
                  className="form-control"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-md-6">
                <label className="form-label">Antragsteller</label>
                <input
                  className="form-control"
                  value={`${user?.first_name || user?.username} ${user?.last_name || ''}`}
                  disabled
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Datum</label>
                <input
                  className="form-control"
                  type="date"
                  name="date"
                  value={formData.date}
                  disabled
                />
              </div>
            </>
          )}
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Kontoinhaber</label>
            <input className="form-control" name="account_holder" value={formData.account_holder} onChange={handleChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">IBAN</label>
            <input className="form-control" name="iban" value={formData.iban} onChange={handleChange} required />
          </div>
        </div>

        <hr />
        <h5 className="mb-3">Dateien hochladen</h5>

        <div className="mb-3">
          <label className="form-label">Rechnungen hochladen (PDF/JPG/PNG)</label>
          <div className="border p-3 rounded bg-light text-center" style={{ cursor: 'pointer' }}>
            <label htmlFor="file-upload" className="form-label m-0">
              <strong>Dateien auswählen oder hierher ziehen</strong>
            </label>
            <input id="file-upload" type="file" className="d-none" accept=".pdf,.jpg,.jpeg,.png" multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                setUploadedFiles(prev => [...prev, ...newFiles.filter(file => !prev.some(existing => existing.name === file.name))]);
                e.target.value = '';
              }}
            />
            <div className="mt-2 small text-muted">
              {uploadedFiles.length > 0 ? `${uploadedFiles.length} Datei(en) hochgeladen` : 'Erlaubte Formate: PDF, JPG, PNG'}
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <ul className="list-group mb-3">
            {uploadedFiles.map((file, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                {file.name}
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => {
                  const fileName = file.name;
                  setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                  setItems(prevItems => prevItems.map(item => item.selectedFileName === fileName ? { ...item, selectedFileName: '' } : item));
                }}>
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr />
        <h5 className="mb-3">Position(en)</h5>

        <div className="accordion mb-3" id="positionsAccordion">
          {items.map((item, index) => {
            const filteredBudgets = budgetEntries.filter(be => String(be.funding_group) === item.fundingGroupId);
            const headingId = `heading-${index}`;
            const collapseId = `collapse-${index}`;

            return (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={headingId}>
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId}>
                    {item.description || 'Keine Bezeichnung'}
                  </button>
                </h2>
                <div id={collapseId} className="accordion-collapse collapse" aria-labelledby={headingId} data-bs-parent="#positionsAccordion">
                  <div className="accordion-body">
                    <div className="row mb-3">
                      <div className="col-md-3">
                        <label className="form-label">Beleg-Datei</label>
                        <select className="form-select" value={item.selectedFileName} onChange={e => handleItemChange(index, 'selectedFileName', e.target.value)} required>
                          <option value="">Datei wählen</option>
                          {uploadedFiles.map(file => (
                            <option key={file.name} value={file.name}>{file.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Position(en)</label>
                        <input className="form-control" value={item.position_number} placeholder="z.B. 1-4, 6-29" onChange={e => handleItemChange(index, 'position_number', e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Bezeichnung</label>
                        <input className="form-control" value={item.description} placeholder="z.B. Weinflaschen Metro" onChange={e => handleItemChange(index, 'description', e.target.value)} required />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Betrag (€)</label>
                        <input className="form-control" type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} required />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Mittelverwendungsgruppe</label>
                        <select className="form-select" value={item.fundingGroupId || ''} onChange={e => handleItemChange(index, 'fundingGroupId', e.target.value)} required>
                          <option value="">Bitte auswählen</option>
                          {fundingGroups.map(fg => (
                            <option key={fg.id} value={fg.id}>{fg.name} {fg.date ? `(${fg.date})` : ''}</option>
                          ))}
                        </select>
                      </div>

                      {item.fundingGroupId && (
                        <div className="col-md-6">
                          <label className="form-label">Budgetkategorie</label>
                          <select className="form-select" value={item.budgetEntryId || ''} onChange={e => handleItemChange(index, 'budgetEntryId', e.target.value)} required>
                            <option value="">Bitte auswählen</option>
                            {budgetEntries
                              .filter(entry => String(entry.funding_group) === item.fundingGroupId)
                              .map(entry => (
                                <option key={entry.id} value={entry.id}>{entry.category}</option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>


                    <div className="text-end">
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>
                        Position löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-3">
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Weitere Position</button>
        </div>

        <div className="mb-3">
          <label className="form-label">Kommentar</label>
          <textarea className="form-control" placeholder="z. B. Anlass der Auslage, wichtige Hinweise oder ergänzende Informationen" name="comment" value={formData.comment} onChange={handleChange} rows={3} />
        </div>

        <div className="text-end">
          <button className="btn btn-primary">Antrag einreichen</button>
        </div>
      </form>
    </div>
  );
}
