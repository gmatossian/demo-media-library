package demo.medialibrary.catalog;

import java.util.Map;

/**
 * List criteria. {@code query} is a trimmed, literal title fragment (or null
 * for no search); {@code type} is null for all types. Both apply together.
 */
public record CatalogFilter(String query, MediaType type) {

	public static final CatalogFilter NONE = new CatalogFilter(null, null);

	public static CatalogFilter of(String rawQuery, String rawType) {
		String type = TextRules.trimToNull(rawType);
		MediaType mediaType = null;
		if (type != null) {
			mediaType = MediaType.parse(type).orElseThrow(() -> new InvalidInputException(
					"Unknown media type filter.",
					Map.of("type", "Type must be one of " + MediaType.allowedValues() + ".")));
		}
		return new CatalogFilter(TextRules.trimToNull(rawQuery), mediaType);
	}
}
