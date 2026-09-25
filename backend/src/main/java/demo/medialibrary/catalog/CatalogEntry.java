package demo.medialibrary.catalog;

import java.time.Instant;

/** A stored catalog record. Only descriptive fields change after creation. */
public record CatalogEntry(
		long id,
		MediaType type,
		String title,
		String creator,
		Integer releaseYear,
		String description,
		Instant createdAt,
		Instant updatedAt) {
}
