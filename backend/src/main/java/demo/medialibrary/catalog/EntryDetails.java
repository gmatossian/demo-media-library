package demo.medialibrary.catalog;

/** Validated, normalized descriptive fields, ready to store. */
public record EntryDetails(
		MediaType type,
		String title,
		String creator,
		Integer releaseYear,
		String description) {
}
