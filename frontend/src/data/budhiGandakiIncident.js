export const BUDHI_GANDAKI_INCIDENT = {
  incidentId: 'budhi-gandaki-2026-10-11',
  title: 'Budhi Gandaki Flood',
  eventDate: '2026-10-11',
  location: 'Gorkha District, Gandaki Province, Nepal',
  hazardType: 'Flash flood; possible landslide-dam breach',
  status: 'Current response status not refreshed since 11 October reporting',
  summary:
    'On 11 October 2026, a flash flood affected the Budhi Gandaki river corridor in Gorkha District. ICIMOD described a possible breach of a temporary landslide blockage near Chumchet. The cause and full extent of damage remain unverified; reported impacts include bridges, riverside settlements, and hydropower construction infrastructure.',
  lastChecked: '2026-10-12',
  sourceReviewNote:
    'ICIMOD and The Kathmandu Post were reviewed on 12 October 2026. No automatic news feed or background refresh is connected.',
  locationPoint: {
    lat: 28.4393919,
    lon: 84.9121183,
    place: 'OpenStreetMap village place node (approximate)',
    sourceName: 'OpenStreetMap Nominatim',
    sourceUrl:
      'https://www.openstreetmap.org/?mlat=28.4393919&mlon=84.9121183#map=14/28.4394/84.9121'
  },
  sources: [
    {
      id: 'icimod',
      name: 'ICIMOD',
      label: 'ICIMOD preliminary assessment',
      url: 'https://www.icimod.org/press-releases/landslide-dam-breach-may-have-triggered-budhi-gandaki-flash-flood/',
      published: '11 Oct 2026',
      reviewStatus: 'Reviewed',
      reportingCutoff: 'Information reviewed as of 11:30 NPT'
    },
    {
      id: 'kathmandu-post',
      name: 'The Kathmandu Post',
      label: 'What we know so far about the damage caused by Budhi Gandaki floods',
      url: 'https://kathmandupost.com/gandaki-province/2026/10/11/what-we-know-so-far-about-the-damage-caused-by-budhi-gandaki-floods',
      published: '11 Oct 2026',
      reviewStatus: 'Reviewed'
    },
  ],
  updates: [
    {
      id: 'icimod-preliminary',
      publicationDate: '2026-10-11',
      publicationLabel: '11 Oct 2026 · information cutoff 11:30 NPT',
      headline: 'Possible landslide-dam breach identified as a flood trigger',
      summary:
        'ICIMOD reported that preliminary accounts reviewed by 11:30 NPT pointed to a possible failure of a temporary landslide blockage near Chumchet. It described warnings along downstream river systems and reported missing people and damage to bridges, riverside infrastructure, and the Budhi Gandaki hydropower construction site; the extent of losses remained under assessment.',
      sourceId: 'icimod',
      category: 'Preliminary assessment'
    },
    {
      id: 'kathmandu-post-impact',
      publicationDate: '2026-10-11',
      publicationLabel: '11 Oct 2026 · publication time not stated',
      headline: 'Bridge and settlement damage reported across Gorkha river communities',
      summary:
        'The Kathmandu Post reported homes swept away or inundated and bridge losses in Chumnubri, Dharche, and Aarughat areas, including at Sirdibas, Machhakhola, and Soti. The report said authorities were still collecting damage information and had not confirmed casualties; it also described four people as unaccounted for.',
      sourceId: 'kathmandu-post',
      category: 'Infrastructure and humanitarian'
    },
  ],
  impact: [
    {
      id: 'bridges',
      category: 'Bridges and crossings',
      report:
        'Bridge losses were reported at Nyakchet–Sirdibas, Machhakhola–Kerauja, Soti, and the Arughat connection between Gorkha and Dhading. Exact counts vary by report and should not be treated as a reconciled inventory.',
      location: 'Chumnubri, Dharche, and Aarughat areas',
      sourceIds: ['kathmandu-post'],
      status: 'Reported by sources'
    },
    {
      id: 'roads',
      category: 'Roads and transport corridors',
      report:
        'Reported bridge losses disrupted local crossings and road connectivity. The sources reviewed do not provide a verified, complete road-damage inventory.',
      location: 'Gorkha–Dhading connection and local river crossings',
      sourceIds: ['kathmandu-post'],
      status: 'Pending verification'
    },
    {
      id: 'residential',
      category: 'Residential buildings and settlements',
      report:
        'Reports describe houses swept away, inundated, or at risk in riverside settlements. Preliminary house counts vary and have not been consolidated into a verified total.',
      location: 'Including Jagat, Sirdibas, Ghattikhola, and Machhakhola',
      sourceIds: ['kathmandu-post'],
      status: 'Reported by sources'
    },
    {
      id: 'hydropower',
      category: 'Hydropower and critical infrastructure',
      report:
        'Damage to a construction camp and equipment at the Budhi Gandaki hydropower project was reported; the full extent of loss remained under assessment.',
      location: 'Salleri, Chumnubri-3',
      sourceIds: ['icimod', 'kathmandu-post'],
      status: 'Reported by sources'
    },
    {
      id: 'river-terrain',
      category: 'River channels and surrounding terrain',
      report:
        'A sediment- and debris-laden flood was reported. A landslide-blockage breach was proposed as a possible trigger, but the cause has not been confirmed.',
      location: 'Budhi Gandaki corridor; possible source areas include Syar and Ungilung',
      sourceIds: ['icimod', 'kathmandu-post'],
      status: 'Pending verification'
    }
  ],
  responsePriorities: [
    'Verify the flood source and affected river reaches through field and agency reports.',
    'Reconcile dated humanitarian reports with responsible authorities and inspect reported crossings before declaring routes safe.',
    'Assess reported settlement and hydropower-site damage; acquire event-specific imagery before publishing geospatial measurements.'
  ]
};
