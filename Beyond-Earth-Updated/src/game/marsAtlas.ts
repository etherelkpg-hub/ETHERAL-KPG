import type { FieldMap } from './store';

export type FieldTool = 'rover' | 'spectrum' | 'drill' | 'station' | 'radar' | 'systems'
  | 'mapping' | 'ice' | 'cameras' | 'sampling' | 'autonomy' | 'arm';
export interface AnalogProperty {
  title: string;
  earth: string;
  mars: string;
  limit: string;
  tool: FieldTool;
  study?: boolean;
}
export interface AnalogSite {
  name: string;
  location: string;
  overview: string;
  notes?: string;
  reference: string;
  properties: AnalogProperty[];
}

export const MARS_REFERENCES = [
  { name: "Mars environment", finding: "Temperatures across Mars range from roughly −153 to 20 °C. The thin, mostly carbon dioxide atmosphere, major dust storms and polar ground ice are key constraints.", use: "This is a broad planetary range. A local Earth reading needs a specific Mars location, measurement method and time window for comparison.", source: "https://science.nasa.gov/mars/facts/" },
  { name: "Jezero Crater · Perseverance", finding: "MEDA monitors temperature, wind, humidity and dust; onboard spectroscopy and RIMFAX investigate surface composition and subsurface layers.", use: "Reference procedures for the station, spectrometer, rover and radar. A radar echo can mark a material boundary without identifying the material.", source: "https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/" },
  { name: "Gale Crater · wind-shaped deposits", finding: "Martian large ripples and ridges make a useful comparison for the Ibex Dune Field study.", use: "Compare shapes at documented scales. Loose sand on Earth does not reproduce Martian wind conditions.", source: "https://ntrs.nasa.gov/citations/20260000452" },
  { name: "Mars resource use · MOXIE", finding: "Perseverance carried an experiment that produced oxygen from the Martian atmosphere.", use: "Earth power and logistics trials prepare procedures. The real Martian atmosphere is a separate condition.", source: "https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/#moxie" },
];

export const MARS_ANALOGS: Record<FieldMap, AnalogSite> = {
  "atacama": {
    name: "Atacama Desert", location: "Northern Chile · South America · 23.86° S, 69.14° W",
    overview: "Hyperarid basin, salt crust and high Andean ridges.",
    reference: "https://www.nasa.gov/universe/atacama-rover-astrobiology-drilling-studies-arads/",
    properties: [
      { title: "Rocky terrain", earth: "Volcanic and sedimentary outcrops", mars: "Similar navigation obstacles at local scale", limit: "Formation scale and composition differ", tool: 'rover' },
      { title: "Steep slopes", earth: "Ridges, valleys and uneven slopes", mars: "Compare relative relief and traverse difficulty", limit: "Do not assume matching slope angles or canyon sizes", tool: 'rover' },
      { title: "Loose soil", earth: "Dry sediment and sand", mars: "Loose material shaped by wind", limit: "Salt, moisture and surface chemistry differ", tool: 'drill' },
      { title: "Crater-like forms", earth: "Volcanic depressions in parts of the region", mars: "Compare shape and navigation", limit: "A volcanic depression has a different origin from an impact crater", tool: 'rover' },
      { title: "Water scarcity", earth: "Hyperarid core with scarce surface water", mars: "Useful for dry-ground trials", limit: "Earth still has rainfall and humidity", tool: 'station' },
      { title: "Temperature variation", earth: "Day and night thermal cycles", mars: "Cycle equipment between warm and cool conditions", limit: "Martian temperatures and atmospheric heat transfer differ", tool: 'station' },
      { title: "Fine dust", earth: "Fine sediment and salt deposits", mars: "Test visibility loss and surface deposition", limit: "Martian dust and storms have distinct scales and behavior", tool: 'station' },
      { title: "Ice and frozen soil", earth: "Snow or ice can occur on high Andean terrain", mars: "A separate high-altitude trial could study cold ground", limit: "A dry basin does not establish that ice exists under it", tool: 'radar' },
      { title: "Isolation", earth: "Remote sectors remain accessible by road", mars: "Test logistics and equipment turnaround", limit: "Resupply on Mars is far more constrained", tool: 'systems' },
      { title: "Light and shadow", earth: "Strong light with low-angle shadows", mars: "Test camera visibility and solar placement", limit: "Solar input differs on Mars", tool: 'station' },
      { title: "Mineral diversity", earth: "Sulphates, chlorides, gypsum, nitrates and clays reported in the region", mars: "Some mineral groups occur on Mars", limit: "Abundance and formation history differ", tool: 'spectrum' },
    ],
  },
  "haughton": {
    name: "Haughton Crater", location: "Devon Island, Nunavut, Canada · 75.37° N, 89.68° W",
    overview: "Arctic impact crater with rocky ground and permafrost.",
    reference: "https://science.nasa.gov/solar-system/planetary-analogs/10-things-to-know-about-planetary-analogs/",
    properties: [
      { title: "Rocky terrain", earth: "Impact deposits and uneven outcrops", mars: "Study navigation over rough ground", limit: "Rock composition is not established as equivalent", tool: 'rover' },
      { title: "Steep slopes", earth: "Rim and uneven approach terrain", mars: "Compare mobility and topographic survey methods", limit: "Site notes do not establish matching slope angles", tool: 'rover' },
      { title: "Loose material", earth: "Rubble and loose surface deposits", mars: "Test collection and mobility in loose material", limit: "Grain sizes and strength need local measurement", tool: 'drill' },
      { title: "Impact crater", earth: "A documented impact structure", mars: "Compare rim, basin and impact morphology", limit: "Equivalent shape alone cannot establish common materials", tool: 'rover' },
      { title: "Polar dryness", earth: "Cold, dry polar desert", mars: "Useful for cold, dry field operations", limit: "Surface water and atmospheric conditions differ", tool: 'station' },
      { title: "Temperature variation", earth: "Low average temperatures and thermal cycles", mars: "Test equipment response in a cold analog", limit: "A local average and a planet-wide average cannot be directly scored", tool: 'station' },
      { title: "Dust", earth: "Site dust evidence is incomplete", mars: "A field test can measure the particle environment", limit: "Martian particle composition and behavior are unconfirmed here", tool: 'station', study: true },
      { title: "Ground ice", earth: "Permafrost and ground ice reported in the region", mars: "A candidate for subsurface and frozen-ground trials", limit: "A radar echo alone does not confirm ice at a test point", tool: 'radar' },
      { title: "Isolation", earth: "Remote access and difficult resupply", mars: "An operational analog for planning logistics", limit: "Mars brings very different access and life-support constraints", tool: 'systems' },
      { title: "Light and shadow", earth: "Low sun angles can cast long shadows", mars: "Test cameras and panel placement", limit: "The site notes contain no matching illumination measurements", tool: 'station', study: true },
      { title: "Field analysis", earth: "Sampling and robotic field operations are documented", mars: "Practice procedures for remote analysis", limit: "A shared procedure is not evidence of equivalent terrain", tool: 'spectrum' },
    ],
  },
  "death-valley": {
    name: "Death Valley", location: "California, United States · 36.24° N, 116.82° W",
    overview: "Dry valley, rocky hills, alluvial fans and wind-shaped dunes.",
    reference: "https://ntrs.nasa.gov/citations/20260000452",
    properties: [
      { title: "Rocky terrain", earth: "Mars Hill includes rocky deposits and exposed basalt", mars: "Useful to compare navigation obstacles with Mars imagery", limit: "Obstacle sizes and material composition need measurements", tool: 'rover' },
      { title: "Steep slopes and fans", earth: "Alluvial fans and elevation change", mars: "Compare fan shape and sediment transport", limit: "The team has not calculated directly comparable slopes", tool: 'rover' },
      { title: "Loose sand and dunes", earth: "Stovepipe Wells and Ibex are distinct dune sites", mars: "Wind-shaped bedforms provide a Mars comparison", limit: "Grain size and compaction need local data", tool: 'rover' },
      { title: "Ubehebe Crater", earth: "Volcanic steam explosion depression", mars: "Compare wall, rim and traverse geometry", limit: "Geological origin must be recorded separately", tool: 'rover' },
      { title: "Geological diversity", earth: "Limestone, quartzite, shale and volcanic rocks in the field notes", mars: "Mars spectra can provide reference signatures", limit: "The notes do not establish a mineral match", tool: 'spectrum' },
      { title: "Temperature variation", earth: "Selected sites still need surface-temperature analysis", mars: "Design a repeated day and night survey", limit: "No comparable observations in the team table", tool: 'station', study: true },
      { title: "Fine dust", earth: "Grain size, shape and adhesion still need study", mars: "Plan a dedicated dust survey", limit: "Existing comparison notes discuss shadows instead", tool: 'station', study: true },
      { title: "Isolation", earth: "Access, resupply and connectivity need their own entry", mars: "Can motivate a logistics scenario", limit: "Existing rows mix isolation with drilling and light", tool: 'systems', study: true },
      { title: "Light and shadow", earth: "Shadow duration has not been measured at selected points", mars: "Model illumination and plan a follow-up survey", limit: "Comparable solar angles and local topography are required", tool: 'station', study: true },
    ],
  },
  "mcmurdo": {
    name: "McMurdo Dry Valleys", location: "Southern Victoria Land, Antarctica · 77°30′ S, 162°00′ E",
    overview: "A cold polar desert with exposed valley floors, glaciers and frozen ground. Researchers have used parts of the region to study processes relevant to Mars.",
    notes: "https://documents.ats.aq/recatt/att482_e.pdf",
    reference: "https://ntrs.nasa.gov/citations/20100003844",
    properties: [
      { title: "Exposed rocky terrain", earth: "Ice-free valley floors with loose glacial deposits", mars: "Practice mapping and rover navigation over mixed gravel and rock", limit: "Gravity and traction on Martian material differ", tool: "rover" },
      { title: "Rock and sediment", earth: "Glacial deposits provide mixed samples", mars: "Practice comparing mineral signatures with compatible Mars spectra", limit: "A similar spectrum must be checked with comparable instruments and sampling", tool: "spectrum" },
      { title: "Dry and frozen ground", earth: "Dry permafrost and ice-cemented ground are documented in parts of the region", mars: "Compare candidate drilling procedures for cold, layered ground", limit: "Depth and strength vary by site. Use local cores to establish the layers", tool: "drill" },
      { title: "Cold polar desert", earth: "Cold air, dry valley floors and exposed terrain", mars: "Plan repeat weather and cold-operation trials", limit: "Antarctica has Earth pressure, gravity and atmospheric composition", tool: "station" },
      { title: "Subsurface boundaries", earth: "Transitions between dry sediment and ice-cemented material can be studied", mars: "Practice following up radar returns with cores", limit: "An echo alone cannot establish the presence of ice", tool: "radar" },
    ],
  },
  "wadi": {
    name: "Wadi Rum", location: "Aqaba Governorate, Jordan · 29.63961° N, 35.43389° E",
    overview: "Sandstone and granite cliffs with red sandy valleys.",
    reference: "https://science.nasa.gov/earth/earth-observatory/wadi-rum-jordan-49945/",
    properties: [
      { title: "Rocky terrain", earth: "Granite and sandstone with exposed layers", mars: "Rough ground and geological fieldwork", limit: "Mars also has a broad range of volcanic and sedimentary rock types", tool: 'rover' },
      { title: "Steep slopes", earth: "Cliffs, canyons and sharp relief", mars: "Test route planning in varied terrain", limit: "Planetary landforms have multiple geological origins", tool: 'rover' },
      { title: "Loose sand", earth: "Sandy valleys and wind-shaped dunes", mars: "Test slip and energy on loose material", limit: "Atmosphere and sediment composition affect transport", tool: 'rover' },
      { title: "Depressions", earth: "Valleys and gorges shaped by erosion and structure", mars: "Compare geometry and access difficulty", limit: "These features are not documented impact craters", tool: 'rover' },
      { title: "Dryness", earth: "Low rainfall with groundwater and sparse vegetation", mars: "Plan fieldwork with limited surface water", limit: "Earth ecosystems and water access differ", tool: 'station' },
      { title: "Temperature variation", earth: "Daily and seasonal differences", mars: "Plan a temperature-cycle equipment test", limit: "A Mars site requires a comparable time window and measurement", tool: 'station' },
      { title: "Fine dust", earth: "Wind moves dust and fine sediment", mars: "Test camera visibility and panel contamination", limit: "Martian storms and atmospheric conditions differ", tool: 'station' },
      { title: "Ground ice", earth: "No comparable ice deposit documented in the site notes", mars: "Use dry terrain for a control survey", limit: "There is no confirmed ice target here", tool: 'radar', study: true },
      { title: "Isolation", earth: "Remote tracts with settlements, tourism and roads", mars: "Plan communications between valleys", limit: "Mars resupply has different constraints", tool: 'systems' },
      { title: "Light and shadow", earth: "Tall cliffs and narrow valleys create moving shadows", mars: "Test navigation imaging and solar positioning", limit: "Solar intensity depends on the location and time reference", tool: 'station' },
      { title: "Field analysis", earth: "Sample collection, microscopy and spectroscopy", mars: "Practice selecting and documenting samples for comparison", limit: "Robot and direct field procedures differ", tool: 'spectrum' },
    ],
  },
};
