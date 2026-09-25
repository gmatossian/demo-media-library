package demo.medialibrary.catalog;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

/** Catalog use cases: validation, identity, and server-controlled timestamps. */
@Service
public class CatalogService {

	private final CatalogRepository repository;
	private final Clock clock;

	public CatalogService(CatalogRepository repository, Clock clock) {
		this.repository = repository;
		this.clock = clock;
	}

	public List<CatalogEntry> list(CatalogFilter filter) {
		return repository.find(filter);
	}

	public CatalogEntry get(long id) {
		return repository.findById(id).orElseThrow(() -> new EntryNotFoundException(id));
	}

	public CatalogEntry create(EntryRequest request) {
		return repository.insert(EntryValidator.validate(request), now());
	}

	public CatalogEntry update(long id, EntryRequest request) {
		EntryDetails details = EntryValidator.validate(request);
		if (!repository.update(id, details, now())) {
			throw new EntryNotFoundException(id);
		}
		return get(id);
	}

	public void delete(long id) {
		if (!repository.delete(id)) {
			throw new EntryNotFoundException(id);
		}
	}

	/** Microsecond precision: the value returned equals what the database stores. */
	Instant now() {
		return Instant.now(clock).truncatedTo(ChronoUnit.MICROS);
	}
}
