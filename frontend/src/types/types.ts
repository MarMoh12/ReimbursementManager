export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface BudgetEntry {
  id: number;
  category: string;
  amount: string;
  funding_group?: number;
}

export interface FundingGroup {
  id: number;
  name: string;
  date: string | null;
  budgets?: BudgetEntry[];
}

export interface ApplicationItem {
  id: number;
  position_number: number;
  description: string;
  amount: string;
  budget_entry?: {
    id: number;
    category: string;
  } | null;
  receipt_file?: string | null;
  funding_group?: {
    id: number;
    name: string;
    date: string | null;
  } | null;
  applicant_name?: string;
}

export interface Application {
  id: number;
  applicant: User;
  iban: string;
  account_holder: string;
  comment: string;
  status: string;
  submitted_at: string;
  items?: ApplicationItem[];
  funding_group?: {
    id: number;
    name: string;
    date: string | null;
  } | null;
}

export interface IncomeEntry {
  id: number;
  funding_group: number;
  amount: string;
  description: string;
}

export interface BookingEntry {
  id: number;
  amount: string | number;
  booking_date: string;
  receipt_number: string;
  purpose: string;
  comment?: string; // 🆕 optional für den neuen Kommentar
  created_at: string;
  balance_before?: string;
  balance_after?: string;
  type: 'income' | 'expense';
  application?: {
    id: number;
    account_holder: string;
  } | null;
  income_entry?: {
    id: number;
    source: string;
  } | null;
  funding_group?: {
    id: number;
    name: string;
  } | null;
}
