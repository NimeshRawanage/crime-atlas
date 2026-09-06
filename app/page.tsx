'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { MapPin, Radar, RefreshCw, ArrowUpRight, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
type Crime = {
  category: string;
  location: { latitude: string; longitude: string; street: { name: string } };
  month: string;
};
const places: Record<string, [number, number]> = {
  London: [51.5074, -0.1278],
  Manchester: [53.4808, -2.2426],
  Birmingham: [52.4862, -1.8904],
  Leeds: [53.8008, -1.5491],
  Liverpool: [53.4084, -2.9916],
  Bristol: [51.4545, -2.5879],
  Cardiff: [51.4816, -3.1791],
  Belfast: [54.5973, -5.9301],
  Newcastle: [54.9783, -1.6178],
  Nottingham: [52.9548, -1.1581],
};
const label = (v: string) =>
  v === 'violent-crime'
    ? 'Violence and sexual offences'
    : v
        .split('-')
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(' ');
const monthLabel = (v: string) =>
  v
    ? new Date(v + '-01T12:00:00').toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'Checking availability';
async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) {
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      d.error || 'The data service is unavailable. Please try again.',
    );
  }
  return r.json() as Promise<T>;
}
function Picker({
  value,
  items,
  onChange,
  name,
}: {
  value: string;
  items: { value: string; label: string }[];
  onChange: (s: string) => void;
  name: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger aria-label={name} className="picker">
        <SelectValue>
          {items.find((x) => x.value === value)?.label || name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((x) => (
          <SelectItem key={x.value} value={x.value}>
            {x.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export default function Home() {
  const mapNode = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    lib = useRef<typeof Leaflet | null>(null),
    heat = useRef<Leaflet.HeatLayer | null>(null),
    circle = useRef<Leaflet.Circle | null>(null);
  const [ready, setReady] = useState(false),
    [place, setPlace] = useState('London'),
    [point, setPoint] = useState<[number, number]>(places.London),
    [dates, setDates] = useState<string[]>([]),
    [month, setMonth] = useState(''),
    [category, setCategory] = useState('all'),
    [crimes, setCrimes] = useState<Crime[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [mapError, setMapError] = useState(''),
    [postcode, setPostcode] = useState(''),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let gone = false;
    let instance: Leaflet.Map;
    (async () => {
      const L = (await import('leaflet')).default;
      (window as unknown as { L: typeof Leaflet }).L = L;
      await import('leaflet.heat');
      if (gone || !mapNode.current) return;
      lib.current = L;
      instance = L.map(mapNode.current, { zoomControl: false }).setView(
        places.London,
        14,
      );
      map.current = instance;
      L.control.zoom({ position: 'topright' }).addTo(instance);
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      )
        .on('tileerror', () =>
          setMapError(
            'Map tiles could not load. The report summary is still available.',
          ),
        )
        .addTo(instance);
      instance.on('click', (e: Leaflet.LeafletMouseEvent) => {
        setPlace('Selected point');
        setPoint([e.latlng.lat, e.latlng.lng]);
      });
      setReady(true);
    })().catch(() =>
      setMapError('The map could not load. Please refresh the page.'),
    );
    return () => {
      gone = true;
      instance?.remove();
    };
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    get<{ date: string }[]>('/api/police?kind=dates', ctrl.signal)
      .then((d: { date: string }[]) => {
        const ds = [...new Set(d.map((x) => x.date))].sort().reverse();
        if (!ds.length) throw new Error('No reporting months are available.');
        setDates(ds);
        setMonth((m) => m || ds[0]);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => ctrl.abort();
  }, [revision]);
  useEffect(() => {
    if (!month) return;
    const ctrl = new AbortController();
    setBusy(true);
    setError('');
    setCrimes([]);
    get<Crime[]>(
      `/api/police?kind=crimes&lat=${point[0]}&lng=${point[1]}&date=${month}`,
      ctrl.signal,
    )
      .then((d: Crime[]) => {
        setCrimes(d);
        setBusy(false);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => ctrl.abort();
  }, [month, point, revision]);
  const filtered = useMemo(
    () => crimes.filter((c) => category === 'all' || c.category === category),
    [crimes, category],
  );
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    crimes.forEach((c) => (counts[c.category] = (counts[c.category] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [crimes]);
  useEffect(() => {
    if (!ready || !map.current || !lib.current) return;
    const L = lib.current;
    map.current.setView(point, 14);
    circle.current?.remove();
    circle.current = L.circle(point, {
      radius: 1609.344,
      color: '#56cec1',
      weight: 1,
      dashArray: '5 7',
      fillOpacity: 0.025,
      interactive: false,
    }).addTo(map.current);
  }, [point, ready]);
  useEffect(() => {
    if (!ready || !map.current || !lib.current) return;
    heat.current?.remove();
    const pts = filtered
      .filter(
        (c) =>
          c.location &&
          Number.isFinite(Number(c.location.latitude)) &&
          Number.isFinite(Number(c.location.longitude)),
      )
      .map(
        (c) =>
          [+c.location.latitude, +c.location.longitude, 0.5] as [
            number,
            number,
            number,
          ],
      );
    heat.current = lib.current
      .heatLayer(pts, {
        radius: 24,
        blur: 20,
        maxZoom: 15,
        minOpacity: 0.25,
        gradient: {
          0.2: '#1cb7b2',
          0.45: '#9cd77b',
          0.65: '#f8dd68',
          0.85: '#fa934a',
          1: '#ef5146',
        },
      })
      .addTo(map.current);
  }, [filtered, ready]);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const d = await get<{
        result: {
          country: string;
          postcode: string;
          latitude: number;
          longitude: number;
        };
      }>('/api/postcode?code=' + encodeURIComponent(postcode.trim()));
      if (d.result.country === 'Scotland') {
        setSearchError('Scotland is not covered by this street-level source.');
        return;
      }
      setPlace(d.result.postcode);
      setPoint([d.result.latitude, d.result.longitude]);
    } catch (e) {
      setSearchError(
        e instanceof Error ? e.message : 'Postcode lookup failed.',
      );
    } finally {
      setSearching(false);
    }
  }
  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <Radar size={25} />
          </span>
          <div>
            Crime Atlas<span className="brand-sub">UNITED KINGDOM</span>
          </div>
        </div>
        <div className="source-status">
          <i /> Published police reports
        </div>
        <a
          href="https://data.police.uk/about/"
          target="_blank"
          rel="noreferrer"
        >
          About the data <ArrowUpRight size={16} />
        </a>
      </header>
      <section className="workspace">
        <aside className="controls">
          <div className="eyebrow">EXPLORE THE DATA</div>
          <h1>Crime, in context.</h1>
          <p className="intro">Explore recorded activity around a place.</p>
          <label>Area</label>
          <Picker
            name="Choose area"
            value={place}
            items={Object.keys(places)
              .map((value) => ({ value, label: value }))
              .concat(place in places ? [] : [{ value: place, label: place }])}
            onChange={(v) => {
              if (places[v]) {
                setPlace(v);
                setPoint(places[v]);
                setSearchError('');
              }
            }}
          />
          <form onSubmit={search} className="postcode">
            <input
              aria-label="UK postcode"
              placeholder="Or enter a UK postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            <button aria-label="Find postcode" disabled={searching}>
              {searching ? '…' : <Search size={18} />}
            </button>
          </form>
          {searchError && (
            <p className="error" role="alert">
              {searchError}
            </p>
          )}
          <label>Reporting month</label>
          <Picker
            name="Reporting month"
            value={month}
            items={dates.map((value) => ({ value, label: monthLabel(value) }))}
            onChange={setMonth}
          />
          <label>Crime type</label>
          <Picker
            name="Crime type"
            value={category}
            items={[
              { value: 'all', label: 'All reported types' },
              ...Array.from(
                new Set([
                  ...breakdown.map((x) => x[0]),
                  ...(category === 'all' ? [] : [category]),
                ]),
              ).map((value) => ({ value, label: label(value) })),
            ]}
            onChange={setCategory}
          />
          <div className="scope">
            <MapPin size={18} />
            <p>
              <strong>1-mile search radius</strong>
              <span>
                Click the map to explore another point, or choose a place above.
              </span>
            </p>
          </div>
          <div className="coverage">
            <span className="eyebrow">COVERAGE</span>
            <p>England · Wales · Northern Ireland</p>
            <p className="muted">
              Scotland is unavailable in this source. Reporting completeness
              varies by force and month.
            </p>
          </div>
          <div className="delay">
            <span className="tiny-dot" />
            Monthly reports, not live incidents.
            <br />
            Locations are anonymised and approximate.
          </div>
        </aside>
        <section className="main-panel">
          <div className="view-heading">
            <div>
              <span className="eyebrow">AREA OVERVIEW</span>
              <h2>
                {place} <span>/ {monthLabel(month)}</span>
              </h2>
            </div>
            <button
              className="refresh"
              onClick={() => setRevision((v) => v + 1)}
              disabled={busy}
            >
              <RefreshCw size={16} className={busy ? 'spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="stats">
            <div>
              <span>Matching reports</span>
              <strong>
                {busy || error ? '—' : filtered.length.toLocaleString('en-GB')}
              </strong>
              <small>
                {category === 'all'
                  ? 'All reported crime types'
                  : label(category)}
              </small>
            </div>
            <div>
              <span>Most reported type</span>
              <strong className="stat-category">
                {busy || error
                  ? '—'
                  : breakdown[0]
                    ? label(breakdown[0][0])
                    : 'No reports returned'}
              </strong>
              <small>Within the selected 1-mile area</small>
            </div>
            <div>
              <span>Reporting period</span>
              <strong className="stat-month">{monthLabel(month)}</strong>
              <small>
                {month === dates[0]
                  ? 'Latest available month'
                  : 'Historical monthly reports'}
              </small>
            </div>
          </div>
          <div className="map-wrap">
            <div
              ref={mapNode}
              className="map"
              aria-label="Interactive crime heatmap. Click to select an area."
            />
            <div className="map-caption">
              <i /> REPORT DENSITY
            </div>
            <div className="map-legend">
              <strong>Recorded activity</strong>
              <div className="gradient" />
              <div className="legend-labels">
                <span>Lower</span>
                <span>Higher</span>
              </div>
              <small>Relative density at this zoom, not a crime rate.</small>
            </div>
            {(busy || error || mapError || !filtered.length) && (
              <div className="map-notice" role="status">
                {busy
                  ? 'Loading published reports…'
                  : error ||
                    mapError ||
                    'No matching reports returned. This does not establish that no crime occurred.'}
              </div>
            )}
          </div>
          <div className="bottom">
            <section className="breakdown">
              <h3>
                Reported crime types{' '}
                <span>
                  {busy
                    ? 'Loading'
                    : `${crimes.length.toLocaleString('en-GB')} total`}
                </span>
              </h3>
              {!busy && !error && breakdown.length > 0 ? (
                <div className="bars">
                  {breakdown.map(([key, count]) => (
                    <button
                      key={key}
                      onClick={() =>
                        setCategory(category === key ? 'all' : key)
                      }
                      aria-pressed={category === key}
                    >
                      <div>
                        <span>{label(key)}</span>
                        <strong>{count.toLocaleString('en-GB')}</strong>
                      </div>
                      <div className="track">
                        <i
                          style={{
                            width: `${(count / breakdown[0][1]) * 100}%`,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  {busy
                    ? 'Waiting for reports…'
                    : error || 'No reports returned for this area and month.'}
                </p>
              )}
            </section>
            <section className="reading">
              <span className="eyebrow">READING THIS MAP</span>
              <h3>
                A view of reports.
                <br />
                Not a measure of safety.
              </h3>
              <p>
                Warmer colours show more reports nearby. Busy places may have
                more reports because more people visit them.
              </p>
              <p>
                Counts are not adjusted for population. Blank areas may reflect
                missing reports or unavailable coverage.
              </p>
              <a
                href="https://data.police.uk/docs/method/crime-street/"
                target="_blank"
                rel="noreferrer"
              >
                Source & methodology <ArrowUpRight size={15} />
              </a>
            </section>
          </div>
          <footer>
            Police.uk open data ·{' '}
            <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">
              Open Government Licence v3.0
            </a>{' '}
            · Refreshed on request
          </footer>
        </section>
      </section>
    </main>
  );
}

