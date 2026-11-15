import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { FIELD_MAPS, useStore } from '@/game/store';
import { MARS_ANALOGS } from '@/game/marsAtlas';
import { COMPARISON_RATINGS, SITE_PROPERTIES, summarizeSiteRatings, type ComparisonRating } from '@/game/siteProperties';
import { closePanel } from '@/game/story';
import { Panel } from './Panel';

function ComparisonGauge({ rating, caption = 'Qualitative analogy rating', testId = 'comparison-rating' }: {
  rating: ComparisonRating | null; caption?: string; testId?: string;
}) {
  const angle = rating ? -162 + 36 * COMPARISON_RATINGS.indexOf(rating) : null;
  return (
    <div className="site-gauge" data-assessed={rating !== null}>
      <div className="site-gauge-dial" aria-hidden="true">
        <div className="site-gauge-arc" />
        {angle !== null && <div className="site-gauge-needle" style={{ '--rating-angle': `${angle}deg` } as CSSProperties} />}
        <div className="site-gauge-pivot" />
      </div>
      <div className="site-gauge-caption">{caption}</div>
      <strong className="site-gauge-rating" data-testid={testId}>{rating ?? 'Not assessed'}</strong>
    </div>
  );
}

export function SiteComparison() {
  const map = useStore((state) => state.game.map);
  const region = FIELD_MAPS.find((field) => field === map);
  const [selection, setSelection] = useState<number | 'overall' | null>(null);
  const showOverall = selection === 'overall';
  const activeRow = useRef<HTMLElement>(null);
  const overallSection = useRef<HTMLElement>(null);
  const overallId = useId();

  useLayoutEffect(() => {
    const row = activeRow.current;
    if (!row) return;
    row.focus({ preventScroll: true });
    row.querySelector('h3')?.scrollIntoView({ block: 'nearest' });
  }, [selection]);

  useLayoutEffect(() => {
    if (showOverall) overallSection.current?.scrollIntoView({ block: 'nearest' });
  }, [showOverall]);

  if (!region) return null;
  const properties = SITE_PROPERTIES[region];
  const overall = showOverall ? summarizeSiteRatings(properties) : null;

  return (
    <Panel title="Earth–Mars Comparison" kicker={MARS_ANALOGS[region].name}
      onClose={closePanel} testId="panel-site-comparison" width="max-w-4xl"
      headerAction={
        <button type="button" className="site-compare-button site-overall-toggle" aria-expanded={showOverall}
          aria-controls={overallId} data-testid="compare-overall"
          onClick={() => setSelection((current) => current === 'overall' ? null : 'overall')}>
          Overall comparison
        </button>
      }>
      <section id={overallId} ref={overallSection} hidden={!overall} className="site-overall" aria-live="polite">
        {overall && <>
          <div>
            <h3 className="font-pixel text-cream text-lg">{MARS_ANALOGS[region].name} compared with Mars</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {overall.ratedCount ? `Average of ${overall.ratedCount} rated properties. Each one counts equally.` : 'No properties have a rating yet.'}
            </p>
          </div>
          <ComparisonGauge rating={overall.rating} caption="Overall match with Mars" testId="overall-comparison-rating" />
        </>}
      </section>
      <div className="site-properties">
        {properties.map(({ property, overview, comparison, rating, note }, index) => {
          const selected = selection === index;
          return (
            <article key={property} className="site-property" data-testid="comparison-item" data-selected={selected}
              tabIndex={selected ? -1 : undefined} ref={selected ? activeRow : undefined}>
              <h3 className="font-pixel">{property}</h3>
              <div className="site-property-copy">
                {selected ? (
                  <>
                    <p data-testid="property-comparison">{comparison}</p>
                    {(note || !rating) && (
                      <p className="site-compare-note">{note ?? 'The project notes lack enough evidence to rate the match for this property.'}</p>
                    )}
                  </>
                ) : <p data-testid="property-overview">{overview}</p>}
              </div>
              {selected ? <ComparisonGauge rating={rating} /> : (
                <button type="button" className="site-compare-button" aria-label={'Comparison for ' + property}
                  onClick={() => setSelection(index)} data-testid="compare-property">Comparison</button>
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
