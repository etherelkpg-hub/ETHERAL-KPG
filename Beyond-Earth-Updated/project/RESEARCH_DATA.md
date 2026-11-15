# Research data

The game starts with empty measurement tables. The research atlas includes published references, and equipment trials use separate educational simulations. The competition and money are fictional.

## Replace measurements during the hackathon

Use the game's data-management screen to select Earth or Mars, import CSV or JSON, map columns, preview errors and missing values, then save. Replacing one body leaves the other body untouched. Imported data is stored in this browser and origin; it is not shared across devices. Mateo's Mars Research app also shows the five site briefs and published reference summaries.

`public/data/import-example.csv` demonstrates the long-form format: one measurement per row. Required columns are `id`, `name`, `attribute`, `value`, `unit`, `source`; include `location` and `evidence` (`demo`, `measured`, or `reference`). Blank values become unavailable, never zero. Numeric values require units. All rows for a record must agree on its name and location, and each attribute can occur only once per record.

JSON accepts either an array of long-form rows or a `records` array containing record metadata and nested `measurements`. See `public/data/earth_measurements.json` for example records. Inputs are limited to 5 MB.

To change defaults, edit the separate files under `public/data/`: `earth_measurements.json`, `mars_reference.json`, `comparison_rules.json`, and `challenge.json`. Missions and destinations are in `missions.json` and `destinations.json`. Site briefs and Mars source links live in `src/game/marsAtlas.ts`. Rules supply an attribute, numeric/categorical kind, comparison unit, tolerance, weight, and a required explanation. Reward settings provide amount, minimum comparable attributes, and score threshold. Validate the full dataset before shipping. Browser-imported data takes priority until restored.

## Interpretation

- Numeric game score: `max(0, 1 - absolute difference / tolerance)`, then a weighted mean across comparable attributes.
- Categorical comparisons use exact case-insensitive labels; they do not infer geological relationships.
- Scores are fractions from 0 to 1, not a scientific probability.
- Missing measurements and incompatible units are excluded, not assigned perfect matches.
- Temperature conversions support Celsius, Kelvin and Fahrenheit; lengths support m, km, cm, mm, ft; angles support deg and rad; ratios support % and fraction.
- Equal unit labels alone cannot establish matching methods, spatial scales, dates, or reference frames. Review source metadata before using a real dataset.
- Cross-planet absolute elevation comparisons with real data are excluded. Define a scientifically justified relative-relief attribute instead.
- Demo tolerances are arbitrary gameplay settings, not NASA-approved thresholds.
- Reward eligibility is separate from award persistence; the gameplay layer must prevent duplicate rewards.

## Persistence and recovery

Research datasets and gameplay saves are separate browser-storage entries. Browser storage can be cleared or denied, and quota errors must be shown. Resetting the dataset removes imported measurements after confirmation.
