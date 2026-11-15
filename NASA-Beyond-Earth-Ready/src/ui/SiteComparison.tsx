import { useLayoutEffect, useRef, useState } from 'react';
import { FIELD_MAPS, useStore } from '@/game/store';
import { MARS_ANALOGS } from '@/game/marsAtlas';
import { COMPARISON_RATINGS, SITE_PROPERTIES, type ComparisonRating } from '@/game/siteProperties';
import { closePanel } from '@/game/story';
import { Panel } from './Panel';

function ComparisonGauge({ rating }: { rating: ComparisonRating | null }) {
  const angle = rating ? -162 + 36 * COMPARISON_RATINGS.indexOf(rating) : null;
  return (
    <div className="site-gauge" data-assessed={rating !== null}>
      <div className="site-gauge-dial" aria-hidden="true">
        <div className="site-gauge-arc" />
        {angle !== null && <div className="site-gauge-needle" style={{ transform: 'rotate(' + angle + 'deg)' }} />}
        <div className="site-gauge-pivot" />
      </div>
      <div className="site-gauge-caption">Qualitative analogy rating</div>
      <strong className="site-gauge-rating" data-testid="comparison-rating">{rating ?? 'Not assessed'}</strong>
    </div>
  );
}

export function SiteComparison() {
  const map = useStore((state) => state.game.map);
  const region = FIELD_MAPS.find((field) => field === map);
  const [selection, setSelection] = useState<number | null>(null);
  const activeRow = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const row = activeRow.current;
    if (!row) return;
    row.focus({ preventScroll: true });
    row.querySelector('h3')?.scrollIntoView({ block: 'nearest' });
  }, [selection]);

  if (!region) return null;

  return (
    <Panel title="Earth–Mars Comparison" kicker={MARS_ANALOGS[region].name}
      onClose={closePanel} testId="panel-site-comparison" width="max-w-4xl">
      <div className="site-properties">
        {SITE_PROPERTIES[region].map(({ property, overview, comparison, rating, note }, index) => {
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
