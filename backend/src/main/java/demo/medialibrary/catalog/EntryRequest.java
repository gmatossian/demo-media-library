package demo.medialibrary.catalog;

/**
 * Descriptive fields as received from a client or fixture file, before
 * trimming and validation. Read-only properties (id, timestamps) are not part
 * of the request and are ignored if sent.
 */
public record EntryRequest(
		String type,
		String title,
		String creator,
		Integer releaseYear,
		String description) {
}
