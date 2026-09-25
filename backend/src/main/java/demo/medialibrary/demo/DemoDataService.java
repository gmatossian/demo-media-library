package demo.medialibrary.demo;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import demo.medialibrary.catalog.CatalogRepository;
import demo.medialibrary.catalog.EntryDetails;
import demo.medialibrary.catalog.EntryValidator;

/**
 * Seeds a new database and resets the catalog to the fixtures. Both operations
 * run in one transaction: they complete fully or leave the catalog unchanged.
 */
@Service
public class DemoDataService {

	private final FixtureCatalog fixtures;
	private final CatalogRepository catalog;
	private final DemoSeedMarker seedMarker;
	private final Clock clock;

	public DemoDataService(FixtureCatalog fixtures, CatalogRepository catalog, DemoSeedMarker seedMarker,
			Clock clock) {
		this.fixtures = fixtures;
		this.catalog = catalog;
		this.seedMarker = seedMarker;
		this.clock = clock;
	}

	/** Loads fixtures only into a database that has never been seeded. */
	@Transactional
	public boolean seedIfNew() {
		if (seedMarker.isSeeded()) {
			return false;
		}
		Instant now = now();
		insertFixtures(validatedFixtures(), now);
		seedMarker.markSeeded(now);
		return true;
	}

	/** Replaces every catalog entry with the fixtures. Touches nothing else. */
	@Transactional
	public int reset() {
		List<EntryDetails> entries = validatedFixtures();
		catalog.deleteAll();
		insertFixtures(entries, now());
		return entries.size();
	}

	// Validate everything before changing data, so bad fixtures fail early.
	private List<EntryDetails> validatedFixtures() {
		return fixtures.entries().stream().map(EntryValidator::validate).toList();
	}

	private void insertFixtures(List<EntryDetails> entries, Instant now) {
		entries.forEach(entry -> catalog.insert(entry, now));
	}

	private Instant now() {
		return Instant.now(clock).truncatedTo(ChronoUnit.MICROS);
	}
}
