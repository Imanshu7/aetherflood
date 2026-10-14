import { HISTORICAL_NEPAL_FLOOD } from './historicalNepalFlood';

export const HISTORICAL_NEPAL_INCIDENT_OVERVIEW = {
  title: 'Nepal–Tibet Floods: Disaster Impact and Infrastructure Damage',
  hazard: 'Flash flooding and debris flows',
  category: 'Cross-border mountain flood disaster',
  recoveryStatus: 'Recovery and infrastructure reconstruction',
  summary:
    'Severe flooding struck northern Nepal near the Tibet border in late August 2026, causing loss of life and widespread damage to communities and critical infrastructure. The disaster affected river corridors associated with the Bhote Koshi and Trishuli systems, where fast-moving floodwaters and debris overwhelmed settlements, roads, bridges and border-area facilities. Damage to homes, bridges and roads disrupted transport links, complicated emergency access and relief distribution, and created longer-term recovery needs.',
  impact: [
    {
      id: 'bridges',
      category: 'Bridges and transport links',
      report:
        'External reporting describes bridges destroyed or severely damaged along affected river corridors, interrupting road connectivity and cross-border movement. Before/after imagery can show visible changes, but this Overview does not identify or count individual bridges.'
    },
    {
      id: 'settlements',
      category: 'Residential settlements',
      report:
        'Reports describe severe damage to riverside homes and buildings, including structures swept away and others left among sediment, boulders and debris. No AetherFlood building-level damage detection is connected to this incident.'
    },
    {
      id: 'roads-border',
      category: 'Roads and border infrastructure',
      report:
        'Reporting documents damage to road corridors and facilities near the Nepal–China border, disrupting transport and access. No complete, verified road or facility loss inventory is computed in this application.'
    },
    {
      id: 'river-terrain',
      category: 'River channels and terrain',
      report:
        'Satellite imagery shows visible channel and sediment changes in selected locations. The image comparison is source imagery, not a georeferenced AetherFlood measurement of channel change, inundation or debris volume.'
    }
  ],
  humanitarian: {
    reportedMinimum: 'More than 470 reported deaths',
    missingFigure: 'Nearly 1,500 people reported missing',
    reportDate: '2026-08-28',
    reportLabel: 'NDTV, 28 August 2026',
    sourceUrl:
      'https://www.ndtv.com/world-news/nepal-flood-death-count-rises-to-469-amid-warning-of-catastrophy-from-tibet-11969448',
    summary:
      'NDTV reported over 470 people killed and nearly 1,500 missing on 28 August 2026. These are dated, evolving reports and not a live or independently reconciled total.',
    clarification:
      'The 1,400–1,500 figure reported by NDTV referred to people missing, not confirmed deaths. NDTV later reported that authorities planned to declare people dead only if they remained missing for 1.5 months; that policy does not itself confirm the final death toll.',
    laterSourceLabel: 'NDTV report on the missing-person declaration policy',
    laterSourceUrl:
      'https://www.ndtv.com/world-news/nepal-to-declare-flood-victims-dead-if-they-remain-missing-for-1-5-months-12168548'
  },
  geospatialTasks: [
    'Changes in river-channel geometry',
    'Visible damage or disappearance of infrastructure',
    'Changes in built-up areas',
    'Sediment and debris deposition',
    'Potentially isolated road corridors'
  ],
  responsePriorities: [
    'Restore safe access across damaged road and bridge corridors.',
    'Assess the structural integrity of remaining buildings and transport infrastructure.',
    'Identify communities with limited access to essential services.',
    'Map river-channel changes and areas exposed to further flooding or erosion.',
    'Support displaced households and restore critical public services.',
    'Maintain updated satellite comparisons and verified infrastructure inventories.'
  ],
  sources: [
    {
      id: 'abc-satellite',
      label: 'ABC News satellite-imagery investigation',
      date: '28 August 2026',
      url: HISTORICAL_NEPAL_FLOOD.sources.abc,
      note: 'Commercial satellite comparison and dated casualty reporting.'
    },
    {
      id: 'ndtv-humanitarian',
      label: 'NDTV flood death and missing-person update',
      date: '28 August 2026',
      url: 'https://www.ndtv.com/world-news/nepal-flood-death-count-rises-to-469-amid-warning-of-catastrophy-from-tibet-11969448',
      note: 'Reports over 470 killed and nearly 1,500 missing; the figures are time-specific.'
    },
    {
      id: 'ndtv-missing-policy',
      label: 'NDTV report on missing-person declaration policy',
      date: '10 October 2026',
      url: 'https://www.ndtv.com/world-news/nepal-to-declare-flood-victims-dead-if-they-remain-missing-for-1-5-months-12168548',
      note: 'Describes a planned presumption-of-death policy for people remaining missing; this is not a final confirmed death count.'
    },
    {
      id: 'wikimedia-comparison',
      label: 'Wikimedia Commons satellite comparison',
      date: 'Image metadata dated 27 August 2026',
      url: 'https://commons.wikimedia.org/wiki/File:Nepal_flood_2026_before_after.webp',
      note:
        'Commons metadata identifies an animated comparison derived from ESA and USGS imagery and lists it as public domain. It is linked as a source, not presented as a locally verified analysis layer.'
    },
    {
      id: 'cry-for-nepal',
      label: 'Cry for Nepal field-photography gallery',
      date: 'Gallery publication date not confirmed',
      url: 'https://cryfornepal.org/gallery',
      note:
        'Supplementary source link; specific dated photographs and reuse terms have not been verified in this application.'
    },
    {
      id: 'eu-sentinel',
      label: 'EU Space Support Office Sentinel-2 comparison',
      date: '12 and 27 August 2026 acquisitions',
      url: 'https://eu-space.europa.eu/components/earth-observation-copernicus/image-of-the-day/aftermath-nepal-flash-flood',
      note: 'Source for the Betrawati/Gerkhu image pair displayed above.'
    }
  ],
  limitations:
    'This is a historical incident summary. Reported humanitarian figures and documented damage are based on external sources. Exact infrastructure-loss totals, affected-area measurements and reconstruction costs should only be displayed when supported by attributable official assessments or documented geospatial analysis. Satellite imagery alone does not confirm casualties or the structural condition of every building.'
};
