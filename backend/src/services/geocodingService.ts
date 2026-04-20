import { sqlite } from '../config/db.js';
import { ConflictError } from '../utils/errors.js';

// Module-level batch guard
let batchInProgress = false;

const NOMINATIM_BASE_URL =
  process.env['NOMINATIM_BASE_URL'] ?? 'https://nominatim.openstreetmap.org';

const USER_AGENT =
  'CRM-Lab/1.0 (https://github.com/atra-consulting/coding-with-ai-lab)';

// Resolve the effective sleep between Nominatim requests.
// In production: floor at 1000 ms (max 1 req/sec) to honour the Nominatim usage policy.
// Outside production (test, development): allow 0 so the test suite runs fast.
const _parsed = Number.parseInt(process.env['GEOCODING_SLEEP_MS'] ?? '', 10);
const _base = Number.isFinite(_parsed) ? _parsed : 3000;
const sleepMs =
  process.env['NODE_ENV'] === 'production' ? Math.max(1000, _base) : _base;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface GeocodeCandidate {
  id: number;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Geocode a single address via the Nominatim search API.
 * Returns { latitude, longitude } on success, null when Nominatim returned an empty result
 * (address not found). Batch callers count null as a failed lookup per REQ-007.
 * Throws on HTTP errors, JSON parse errors, or NaN coordinates.
 */
export async function geocodeAdresse(
  adresse: Pick<GeocodeCandidate, 'street' | 'houseNumber' | 'postalCode' | 'city' | 'country'>
): Promise<{ latitude: number; longitude: number } | null> {
  const params = new URLSearchParams();

  const street =
    adresse.houseNumber && adresse.street
      ? `${adresse.houseNumber} ${adresse.street}`
      : adresse.houseNumber ?? adresse.street ?? undefined;

  if (street) params.set('street', street);
  if (adresse.postalCode) params.set('postalcode', adresse.postalCode);
  if (adresse.city) params.set('city', adresse.city);
  if (adresse.country) params.set('country', adresse.country);
  params.set('format', 'json');
  params.set('limit', '1');

  const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP error: ${response.status} ${response.statusText}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Nominatim response is not valid JSON');
  }

  if (!Array.isArray(data)) {
    throw new Error('Nominatim response is not an array');
  }

  if (data.length === 0) {
    return null;
  }

  const first = data[0] as Record<string, unknown>;
  const latitude = parseFloat(first['lat'] as string);
  const longitude = parseFloat(first['lon'] as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Nominatim returned NaN coordinates');
  }

  return { latitude, longitude };
}

/**
 * Run a geocoding batch over the adresse table.
 *
 * @param force - When true, re-geocode rows that already have coordinates.
 *                When false (default), only process rows where lat or lon is NULL.
 *
 * Returns counters: total, succeeded, failed, skippedInsufficientData.
 */
export async function runGeocodingBatch({
  force,
}: {
  force: boolean;
}): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  skippedInsufficientData: number;
}> {
  if (batchInProgress) {
    throw new ConflictError('Geokodierung läuft bereits');
  }

  batchInProgress = true;

  try {
    // No index on (latitude, longitude) is needed — the adresse table is small
    // (tens of rows), so a full scan is negligible.
    const selectSql = force
      ? `SELECT id, street, houseNumber, postalCode, city, country, latitude, longitude
         FROM adresse
         ORDER BY id ASC`
      : `SELECT id, street, houseNumber, postalCode, city, country, latitude, longitude
         FROM adresse
         WHERE latitude IS NULL OR longitude IS NULL
         ORDER BY id ASC`;

    const rows = sqlite.prepare(selectSql).all() as GeocodeCandidate[];

    // Prepare the UPDATE statement once — reused for every successful geocode.
    const updateStmt = sqlite.prepare(
      'UPDATE adresse SET latitude = ?, longitude = ?, updatedAt = ? WHERE id = ?'
    );

    let succeeded = 0;
    let failed = 0;
    let skippedInsufficientData = 0;
    let nonSkippedCount = 0;

    for (const row of rows) {
      // Skip rows that have neither city nor postalCode — Nominatim cannot find them.
      const hasCity = row.city !== null && row.city !== '';
      const hasPostalCode = row.postalCode !== null && row.postalCode !== '';

      if (!hasCity && !hasPostalCode) {
        skippedInsufficientData++;
        console.error(
          `[geocoding] id=${row.id}: skipped — no city and no postalCode`
        );
        continue;
      }

      // Honour the Nominatim usage policy: sleep BEFORE each call except the first.
      if (nonSkippedCount > 0) {
        await sleep(sleepMs);
      }
      nonSkippedCount++;

      try {
        const result = await geocodeAdresse(row);

        if (result !== null) {
          updateStmt.run(result.latitude, result.longitude, new Date().toISOString(), row.id);
          succeeded++;
        } else {
          failed++;
          console.error(`[geocoding] id=${row.id}: not found by Nominatim`);
        }
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[geocoding] id=${row.id}: error — ${message}`);
      }
    }

    const total = rows.length;
    console.info(
      `[geocoding] batch complete — total=${total}, succeeded=${succeeded}, failed=${failed}, skipped=${skippedInsufficientData}`
    );

    return { total, succeeded, failed, skippedInsufficientData };
  } finally {
    batchInProgress = false;
  }
}
