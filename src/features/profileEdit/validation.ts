import type { CertificateForm, ExperienceForm, PortfolioForm } from './types';

export type FormErrors = Record<string, string>;

export function validateBasics(name: string, required: string, invalidName: string): FormErrors {
  const trimmed = name.trim();
  if (!trimmed) return { name: required };
  if (trimmed.split(/\s+/).length < 2) return { name: invalidName };
  return {};
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateExperience(form: ExperienceForm, messages: { required: string; invalidDate: string; invalidExperienceDates: string }): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = messages.required;
  if (!form.employmentType.trim()) errors.employmentType = messages.required;
  if (!isDate(form.startedAt)) errors.startedAt = messages.invalidDate;
  if (form.endedAt && !isDate(form.endedAt)) errors.endedAt = messages.invalidDate;
  if (form.endedAt && isDate(form.startedAt) && isDate(form.endedAt) && form.endedAt < form.startedAt) errors.endedAt = messages.invalidExperienceDates;
  return errors;
}

export function validatePortfolio(form: PortfolioForm, messages: { required: string }): FormErrors {
  return form.title.trim() ? {} : { title: messages.required };
}

export function validateCertificate(form: CertificateForm, messages: { required: string; invalidDate: string }): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = messages.required;
  if (!form.issuer.trim()) errors.issuer = messages.required;
  if (!isDate(form.issuedAt)) errors.issuedAt = messages.invalidDate;
  return errors;
}

export function formatDateForApi(value: Date, monthOnly = false): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = monthOnly ? '01' : String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
