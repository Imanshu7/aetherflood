import React from 'react';
import { MapPin } from 'lucide-react';

export function IncidentPanel({ children, className = '', style, ...props }) {
  return (
    <section className={`incident-panel ${className}`.trim()} style={style} {...props}>
      {children}
    </section>
  );
}

export function IncidentHeader({ eyebrow, title, titleId, location, eventDate, dateLabel, status }) {
  return (
    <header className="incident-header">
      <div>
        <div className="incident-eyebrow">{eyebrow}</div>
        <h2 id={titleId} className="incident-title">{title}</h2>
        <div className="incident-location">
          <MapPin size={14} aria-hidden="true" />
          <span>{location}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={eventDate}>{dateLabel}</time>
        </div>
      </div>
      <div className="incident-header-status" role="status">{status}</div>
    </header>
  );
}

export function IncidentSectionHeading({ eyebrow, title, titleId, icon: Icon, status, note }) {
  return (
    <div className="incident-section-heading">
      <div>
        {eyebrow && <div className="incident-eyebrow">{eyebrow}</div>}
        <h3 id={titleId}>
          {Icon && <Icon size={17} aria-hidden="true" />}
          {title}
        </h3>
      </div>
      {(status || note) && (
        <span className="incident-section-note">{status || note}</span>
      )}
    </div>
  );
}
