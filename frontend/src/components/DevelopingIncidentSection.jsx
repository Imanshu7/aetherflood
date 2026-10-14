import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  Radio,
  Satellite,
  ShieldCheck
} from 'lucide-react';
import { BUDHI_GANDAKI_INCIDENT as incident } from '../data/budhiGandakiIncident';
import { TRANSLATIONS } from '../data/translations';
import { IncidentHeader, IncidentPanel, IncidentSectionHeading } from './IncidentPrimitives';
import { TranslationNotice, emphasize, useBatchTranslate } from './Translation';

const sourceById = Object.fromEntries(incident.sources.map((source) => [source.id, source]));

const linkStyle = {
  color: '#1e783e',
  textDecoration: 'underline',
  textUnderlineOffset: '2px'
};

function SourceLink({ sourceId, children }) {
  const source = sourceById[sourceId];
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
      {children || source.name}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

const HUMANITARIAN_TEXT =
  'The Kathmandu Post reported four people unaccounted for on 11 October and said authorities had not confirmed casualties at publication. This is a dated preliminary report, not a current casualty or rescue-operation count.';
// Overview displays only the transport-focused entries; the remaining impact
// records stay in the data file for provenance but are not rendered here.
const VISIBLE_IMPACT_IDS = new Set(['bridges', 'roads']);
const DISCREPANCY_TEXT =
  'ICIMOD described a possible landslide-blockage breach; the cause remains unconfirmed. Damage descriptions and the four-person unaccounted report are preliminary and are not reconciled totals or current counts.';
const IMAGE_NOTE_TEXT =
  'No verified high-resolution before/after image pair for this October incident is available. Low-resolution regional MODIS tiles are not used as event-damage evidence. The August Nepal–Tibet satellite images show a different flood and are kept separate.';
const SATELLITE_EMPTY_TEXT =
  'No verified satellite pair for this October incident is connected. The Compare workspace is reserved for the separate 26 August Nepal–Tibet flood; its imagery and products are not evidence for Budhi Gandaki.';

function statusLabel(status, t) {
  if (status === 'Pending verification') return t.developing.pendingVerification;
  return t.developing.evidenceStatus;
}

export default function DevelopingIncidentSection({ onNavigateToCompare, onNavigateToIncidents, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const lastCheckedLabel = new Date(`${incident.lastChecked}T12:00:00`).toLocaleDateString(
    lang === 'ne' ? 'ne-NP' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  const visibleImpacts = useMemo(
    () => incident.impact.filter((item) => VISIBLE_IMPACT_IDS.has(item.id)),
    []
  );

  const sourceTexts = useMemo(() => ([
    incident.summary,
    incident.updates[0].headline,
    incident.updates[0].summary,
    incident.updates[1].headline,
    incident.updates[1].summary,
    incident.updates[0].category,
    incident.updates[1].category,
    ...visibleImpacts.flatMap((item) => [item.category, item.report, item.location]),
    ...incident.responsePriorities,
    HUMANITARIAN_TEXT,
    DISCREPANCY_TEXT,
    IMAGE_NOTE_TEXT,
    SATELLITE_EMPTY_TEXT,
    incident.title,
    incident.updates[0].publicationLabel,
    incident.updates[1].publicationLabel,
    incident.sourceReviewNote,
  ]), [visibleImpacts]);
  const { strings: tr, isTranslating, error: trError, retry: trRetry } = useBatchTranslate(sourceTexts, lang);
  const at = (i) => tr[i] ?? sourceTexts[i];
  // Layout: 0 summary; 1-4 update headline/summary pairs; 5-6 update categories;
  // 7+ impact triples; then priorities; then 4 standalone paragraphs;
  // then title, publication labels, and the review note.
  const impactBase = 7;
  const prioritiesBase = impactBase + visibleImpacts.length * 3;
  const extraBase = prioritiesBase + incident.responsePriorities.length;
  const titleIdx = extraBase + 4;
  const pubLabelBase = titleIdx + 1;
  const reviewNoteIdx = pubLabelBase + incident.updates.length;

  const sortedUpdates = incident.updates.slice().sort((a, b) => a.publicationDate.localeCompare(b.publicationDate));
  const updateTextIndex = (update) => {
    const i = incident.updates.indexOf(update);
    return i === 0 ? [1, 2, 5] : [3, 4, 6];
  };

  return (
    <section aria-labelledby="developing-incident-title" className="developing-incident">
      <IncidentPanel className="developing-incident-lead" aria-labelledby="developing-incident-title">
        <IncidentHeader
          eyebrow={t.developing.eyebrow}
          title={at(titleIdx)}
          titleId="developing-incident-title"
          location={incident.location}
          eventDate={incident.eventDate}
          dateLabel={lang === 'ne' ? '११ अक्टोबर २०२६' : '11 October 2026'}
          status={t.developing.assessmentStatus}
        />

        <div className="developing-incident-summary-grid">
          <div>
            <h3 className="developing-incident-subheading">{t.developing.summaryHeading}</h3>
            <p className="developing-incident-summary">{emphasize(at(0), lang)}</p>
            <p className="developing-incident-caveat">
              {t.developing.caveat}
            </p>
            <div className="developing-incident-actions">
              <a
                className="btn-dark-green-pill"
                href={sourceById.icimod.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.developing.detailedReport} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <button type="button" className="btn-white-pill" onClick={onNavigateToIncidents}>
                {t.developing.openIncidents}
              </button>
              <button type="button" className="btn-white-pill" onClick={onNavigateToCompare}>
                {t.developing.openCompare}
              </button>
            </div>
            <div className="developing-incident-checked">
              <Clock3 size={13} aria-hidden="true" />
              <time dateTime={incident.lastChecked}>
                {t.developing.lastChecked} {lastCheckedLabel} · {t.developing.lastCheckedSuffix}
              </time>
            </div>
          </div>

          <aside className="developing-incident-image-panel" aria-label="Satellite imagery availability for the Budhi Gandaki flood">
            <div className="developing-incident-map-heading">
              <strong>{t.developing.imageUnavailable}</strong>
              <span>{t.developing.imageUnavailableSub}</span>
            </div>
            <p className="developing-incident-image-note">
              {at(extraBase + 2)}
            </p>
            <div className="developing-incident-image-sources">
              <a href={sourceById.icimod.url} target="_blank" rel="noopener noreferrer" className="developing-incident-map-source">
                ICIMOD Budhi Gandaki source report
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={incident.locationPoint.sourceUrl} target="_blank" rel="noopener noreferrer" className="developing-incident-map-source">
                Approximate Chumchet place reference · OpenStreetMap Nominatim
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <button type="button" className="btn-white-pill" onClick={onNavigateToCompare}>
                {t.developing.openAugustComparison}
              </button>
            </div>
          </aside>
        </div>
        <TranslationNotice error={trError} onRetry={trRetry} lang={lang} />
        {isTranslating && (
          <p className="developing-incident-note" role="status">{t.common.translating}</p>
        )}
      </IncidentPanel>

      <IncidentPanel aria-labelledby="humanitarian-status-title">
        <IncidentSectionHeading
          eyebrow={t.developing.humanitarianEyebrow}
          title={t.developing.humanitarianTitle}
          titleId="humanitarian-status-title"
          icon={AlertTriangle}
          status={t.developing.humanitarianStatus}
        />
        <p className="developing-incident-humanitarian">
          {emphasize(at(extraBase), lang)}
        </p>
        <div className="developing-incident-source-line">
          {t.developing.sourcesLabel} <SourceLink sourceId="kathmandu-post" />
        </div>
      </IncidentPanel>

      <div className="developing-incident-grid">
        <IncidentPanel aria-labelledby="situation-updates-title">
          <IncidentSectionHeading
            eyebrow={t.developing.timelineEyebrow}
            title={t.developing.timelineTitle}
            titleId="situation-updates-title"
            note={t.developing.timelineNote}
          />
          <div className="developing-incident-timeline">
            {sortedUpdates.map((update) => {
              const [hi, si, ci] = updateTextIndex(update);
              return (
                <article key={update.id} className="developing-incident-timeline-item">
                  <div className="developing-incident-timeline-marker" aria-hidden="true" />
                  <div className="developing-incident-timeline-content">
                    <div className="developing-incident-timeline-meta">
                      <time dateTime={update.publicationDate}>{at(pubLabelBase + incident.updates.indexOf(update))}</time>
                      <span>{at(ci)}</span>
                    </div>
                    <h4>{at(hi)}</h4>
                    <p>{at(si)}</p>
                    <div className="developing-incident-source-line">
                      {t.developing.sourcesLabel} <SourceLink sourceId={update.sourceId} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="developing-incident-note">
            {t.developing.timelineFootnote} {t.developing.timelineFootnote2} {t.developing.lastChecked} {lastCheckedLabel}.
          </p>
        </IncidentPanel>

        <IncidentPanel aria-labelledby="infrastructure-impact-title">
          <IncidentSectionHeading
            eyebrow={t.developing.infraEyebrow}
            title={t.developing.infraTitle}
            titleId="infrastructure-impact-title"
            icon={ShieldCheck}
          />
          <div className="developing-incident-impact-list">
            {visibleImpacts.map((item, itemIndex) => (
              <article key={item.id} className="developing-incident-impact-item">
                <div className="developing-incident-impact-top">
                  <h4>{at(impactBase + itemIndex * 3)}</h4>
                  <span className="developing-incident-evidence-label">{statusLabel(item.status, t)}</span>
                </div>
                <p>{emphasize(at(impactBase + itemIndex * 3 + 1), lang)}</p>
                <div className="developing-incident-impact-meta">
                  <span><strong>{t.developing.reportedLocation}</strong> {at(impactBase + itemIndex * 3 + 2)}</span>
                  <span><strong>{t.developing.appAnalysis}</strong> {t.developing.appAnalysisMissing}</span>
                  <span>
                    <strong>{t.developing.sourcesLabel}</strong>{' '}
                    {item.sourceIds.map((sourceId, index) => (
                      <React.Fragment key={sourceId}>
                        {index > 0 && ', '}
                        <SourceLink sourceId={sourceId} />
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </IncidentPanel>
      </div>

      <IncidentPanel aria-labelledby="satellite-evidence-title">
        <IncidentSectionHeading
          eyebrow={t.developing.satelliteEyebrow}
          title={t.developing.satelliteTitle}
          titleId="satellite-evidence-title"
          icon={Satellite}
          status={t.developing.satelliteStatus}
        />
        <div className="developing-incident-imagery-empty">
          <div className="developing-incident-imagery-icon"><Radio size={19} aria-hidden="true" /></div>
          <div>
            <strong>{t.developing.satelliteEmptyTitle}</strong>
            <p>
              {at(extraBase + 3)}
            </p>
          </div>
        </div>
        <div className="developing-incident-actions">
          <button type="button" className="btn-white-pill" onClick={onNavigateToCompare}>
            {t.developing.openCompareWorkspace}
          </button>
          <a href={sourceById.icimod.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {t.developing.reviewEvidence} <ArrowUpRight size={13} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </IncidentPanel>

      <IncidentPanel aria-labelledby="response-priorities-title">
        <IncidentSectionHeading
          eyebrow={t.developing.prioritiesEyebrow}
          title={t.developing.prioritiesTitle}
          titleId="response-priorities-title"
        />
        <ol className="developing-incident-priorities">
          {incident.responsePriorities.map((priority, i) => <li key={priority}>{at(prioritiesBase + i)}</li>)}
        </ol>
      </IncidentPanel>

      <details className="developing-incident-sources">
        <summary>
          <span>{t.developing.sourcesDetails}</span>
          <span className="developing-incident-muted">{t.common.expand}</span>
        </summary>
        <div className="developing-incident-source-list">
          {incident.sources.map((source) => (
            <div key={source.id} className="developing-incident-source-row">
              <div>
                <SourceLink sourceId={source.id}>{source.label}</SourceLink>
                <span className="developing-incident-source-date">
                  {' '}· {source.published}{source.reportingCutoff ? ` · ${source.reportingCutoff}` : ''}
                </span>
              </div>
              <span className={source.reviewStatus === 'Reviewed' ? 'developing-incident-source-reviewed' : 'developing-incident-source-unverified'}>
                {source.reviewStatus === 'Reviewed' ? t.developing.reviewed : source.reviewStatus}
              </span>
            </div>
          ))}
          <div className="developing-incident-discrepancy">
            <AlertTriangle size={16} aria-hidden="true" />
            <p>
              {at(extraBase + 1)}
            </p>
          </div>
          <p className="developing-incident-note">
            {at(reviewNoteIdx)} {t.developing.timelineFootnote}
          </p>
        </div>
      </details>
    </section>
  );
}
