import React from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, Utensils } from 'lucide-react';

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title d-flex flex-wrap align-items-end justify-content-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="fw-semibold">{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="title-action">{action}</div>}
    </div>
  );
}
export function Notice({ children, type = 'error' }) {
  return children ? (
    <div
      className={`notice alert alert-${type === 'success' ? 'success' : 'danger'} border-0 ${type}`}
      role="status"
    >
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  ) : null;
}
export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={22} />
      {label}
    </div>
  );
}
export function Empty({ title = 'Nothing here yet', text = 'Items you add will show here.' }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Utensils size={22} />
      </div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="form-label fw-semibold mb-1">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Button({ children, variant = 'primary', loading = false, ...props }) {
  const bootstrapVariant =
    {
      primary: 'btn-success',
      secondary: 'btn-outline-secondary',
      danger: 'btn-danger',
      'small-success': 'btn-outline-success',
      'small-danger': 'btn-outline-danger',
      cream: 'btn-light',
    }[variant] || 'btn-secondary';

  return (
    <button
      className={`btn ${bootstrapVariant} button ${variant}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle className="spin" size={16} />} {children}
    </button>
  );
}
export function Modal({ title, onClose, children }) {
  return (
    <div
      className="app-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="app-modal">
        <div className="modal-head d-flex align-items-center justify-content-between">
          <h2 className="fw-semibold mb-0">{title}</h2>
          <button aria-label="Close" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Confirm({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Please confirm" onClose={onCancel}>
      <p>{message}</p>
      <div className="modal-actions d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
