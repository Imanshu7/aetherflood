import React, { useMemo } from 'react';
import { AlertTriangle, ArrowUpRight, Satellite } from 'lucide-react';
import { HISTORICAL_NEPAL_FLOOD as incident } from '../data/historicalNepalFlood';
import { HISTORICAL_NEPAL_INCIDENT_OVERVIEW as overview } from '../data/historicalNepalIncident';
import { TRANSLATIONS } from '../data/translations';
import { IncidentHeader, IncidentPanel, IncidentSectionHeading } from './IncidentPrimitives';
import { HistoricalAutoComparison } from './HistoricalImageComparison';
import { TranslationNotice, emphasize, useBatchTranslate } from './Translation';

const SAT_PARA =
  'The source-linked comparison below shows a documented river-channel and sediment change near Betrawati and Gerkhu. The panels are image crops from a published comparison, not independently georeferenced rasters or a complete damage inventory.';
const GEO_NOTE =
  'This Overview has no registered, co-registered image-analysis outputs for these tasks. No area, structure count, route status or confidence estimate is inferred from the displayed comparison.';

export default function HistoricalIncidentSection({ onNavigateToCompare, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const sourceTexts = useMemo(() => ([
    overview.title,
    overview.hazard,
    overview.category,
    overview.recoveryStatus,
    overview.summary,
    ...overview.impact.flatMap((item) => [item.category, item.report]),
    overview.humanitarian.reportedMinimum,
    overview.humanitarian.missingFigure,
    overview.humanitarian.summary,
    overview.humanitarian.clarification,
    overview.humanitarian.reportLabel,
    overview.humanitarian.laterSourceLabel,
    SAT_PARA,
    GEO_NOTE,
    ...overview.geospatialTasks,
    ...overview.responsePriorities,
    overview.limitations,
    ...overview.sources.map((source) => source.note),
  ]), []);
  const { strings: tr, isTranslating, error: trError, retry: trRetry } = useBatchTranslate(sourceTexts, lang);
  const at = (i) => tr[i] ?? sourceTexts[i];

  const impactBase = 5;
  const humBase = impactBase + overview.impact.length * 2;
  const tasksBase = humBase + 8;
  const prioritiesBase = tasksBase + overview.geospatialTasks.length;
  const limitationsIdx = prioritiesBase + overview.responsePriorities.length;
  const notesBase = limitationsIdx + 1;

  return (
    <section className="developing-incident historical-incident" aria-labelledby="historical-nepal-overview-title">
      <IncidentPanel className="historical-incident-panel">
        <IncidentHeader
          eyebrow={t.historical.eyebrow}
          title={at(0)}
          titleId="historical-nepal-overview-title"
          location={incident.location}
          eventDate={incident.eventDate}
          dateLabel={lang === 'ne' ? '२६ अगस्ट २०२६' : '26 August 2026'}
          status={at(3)}
        />

        <dl className="historical-incident-metadata" aria-label="Historical incident details">
          <div><dt>{t.historical.metadataIncident}</dt><dd>{lang === 'ne' ? '२६ अगस्ट २०२६' : '26 August 2026'}</dd></div>
          <div><dt>{t.historical.metadataHazard}</dt><dd>{at(1)}</dd></div>
          <div><dt>{t.historical.metadataCategory}</dt><dd>{at(2)}</dd></div>
          <div><dt>{t.historical.metadataMapping}</dt><dd>Copernicus DEM & Post-Hoc Check ({incident.activationCode})</dd></div>
        </dl>

        <IncidentSectionHeading
          title={t.historical.executiveSummary}
        />
        <p className="developing-incident-summary">{emphasize(at(4), lang)}</p>
        <div className="developing-incident-source-line">
          {t.historical.sourcePrefix}: <a href={overview.sources[0].url} target="_blank" rel="noopener noreferrer">
            {overview.sources[0].label} <ArrowUpRight size={12} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a> · {overview.sources[0].date}
        </div>
        {isTranslating && (
          <p className="developing-incident-note" role="status">{t.common.translating}</p>
        )}
        <TranslationNotice error={trError} onRetry={trRetry} lang={lang} />
      </IncidentPanel>

      <IncidentPanel aria-labelledby="historical-infrastructure-title">
        <IncidentSectionHeading
          eyebrow={t.historical.infraEyebrow}
          title={t.historical.infraTitle}
          titleId="historical-infrastructure-title"
        />
        <div className="historical-incident-impact-grid">
          {overview.impact.map((item, itemIndex) => (
            <article className="historical-incident-impact-item" key={item.id}>
              <h4>{at(impactBase + itemIndex * 2)}</h4>
              <p>{emphasize(at(impactBase + itemIndex * 2 + 1), lang)}</p>
              <div className="historical-incident-evidence">
                <span><strong>{t.historical.evidenceSources}</strong> · {t.historical.evidenceQualitative}</span>
                <span><strong>{t.historical.evidenceDetection}</strong> · {t.historical.evidenceDetectionMissing}</span>
              </div>
              <div className="historical-incident-source-detail">
                {t.historical.sourcePrefix}: <a href={overview.sources[0].url} target="_blank" rel="noopener noreferrer">
                  ABC News satellite investigation
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </IncidentPanel>

      <IncidentPanel aria-labelledby="historical-humanitarian-title">
        <IncidentSectionHeading
          eyebrow={t.historical.humanitarianEyebrow}
          title={t.historical.humanitarianTitle}
          titleId="historical-humanitarian-title"
          icon={AlertTriangle}
          status={t.historical.humanitarianStatus}
        />
        <p className="historical-incident-humanitarian-figure">
          {at(humBase)}
        </p>
        <p className="historical-incident-humanitarian-missing">
          {at(humBase + 1)}
        </p>
        <p className="developing-incident-humanitarian">{emphasize(at(humBase + 2), lang)}</p>
        <div className="historical-incident-source-line">
          {t.historical.sourcePrefix}: <a href={overview.humanitarian.sourceUrl} target="_blank" rel="noopener noreferrer">
            {at(humBase + 4)} <ArrowUpRight size={12} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <p className="historical-incident-unverified">
          {at(humBase + 3)}
          {' '}
          <a href={overview.humanitarian.laterSourceUrl} target="_blank" rel="noopener noreferrer">
            {at(humBase + 5)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </IncidentPanel>

      <IncidentPanel aria-labelledby="historical-satellite-evidence-title">
        <IncidentSectionHeading
          eyebrow={t.historical.satelliteEyebrow}
          title={t.historical.satelliteTitle}
          titleId="historical-satellite-evidence-title"
          icon={Satellite}
          status={t.historical.satelliteStatus}
        />
        <p className="developing-incident-humanitarian">
          {at(humBase + 6)}
        </p>
      </IncidentPanel>

      <div>
        <HistoricalAutoComparison lang={lang} />
        <div className="developing-incident-actions">
          <button type="button" className="btn-dark-green-pill" onClick={onNavigateToCompare}>
            {t.historical.openCompareWorkspace}
          </button>
        </div>
      </div>

      <IncidentPanel aria-labelledby="historical-geospatial-title">
        <IncidentSectionHeading
          eyebrow={t.historical.geoEyebrow}
          title={t.historical.geoTitle}
          titleId="historical-geospatial-title"
          icon={Satellite}
          status={t.historical.geoStatus}
        />
        <ul className="historical-incident-task-list">
          {overview.geospatialTasks.map((task, i) => <li key={task}>{at(tasksBase + i)}</li>)}
        </ul>
        <p className="developing-incident-note">
          {at(humBase + 7)}
        </p>
      </IncidentPanel>

      <IncidentPanel aria-labelledby="historical-response-title">
        <IncidentSectionHeading
          eyebrow={t.historical.prioritiesEyebrow}
          title={t.historical.prioritiesTitle}
          titleId="historical-response-title"
        />
        <ol className="developing-incident-priorities">
          {overview.responsePriorities.map((priority, i) => <li key={priority}>{at(prioritiesBase + i)}</li>)}
        </ol>
      </IncidentPanel>

      <details className="developing-incident-sources">
        <summary>
          <span>{t.developing.sourcesDetails}</span>
          <span className="developing-incident-muted">{t.common.expand}</span>
        </summary>
        <div className="developing-incident-source-list">
          {overview.sources.map((source, i) => (
            <div className="developing-incident-source-row" key={source.id}>
              <div>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.label} <ArrowUpRight size={12} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <div className="historical-incident-source-detail">
                  {source.date} · {at(notesBase + i)}
                </div>
              </div>
            </div>
          ))}
          <p className="developing-incident-note">{at(limitationsIdx)}</p>
        </div>
      </details>
    </section>
  );
}
