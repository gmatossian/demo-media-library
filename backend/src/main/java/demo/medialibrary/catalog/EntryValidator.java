package demo.medialibrary.catalog;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Catalog field rules. Lengths are measured after trimming, in UTF-16 code
 * units (Java {@code String.length()}, the same as JavaScript).
 */
public final class EntryValidator {

	public static final int TITLE_MAX_LENGTH = 200;
	public static final int CREATOR_MAX_LENGTH = 200;
	public static final int DESCRIPTION_MAX_LENGTH = 2000;
	public static final int YEAR_MIN = 1000;
	public static final int YEAR_MAX = 2100;

	private EntryValidator() {
	}

	public static EntryDetails validate(EntryRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();

		String rawType = TextRules.trimToNull(request.type());
		MediaType type = MediaType.parse(rawType).orElse(null);
		if (rawType == null) {
			errors.put("type", "Type is required.");
		}
		else if (type == null) {
			errors.put("type", "Type must be one of " + MediaType.allowedValues() + ".");
		}

		String title = requiredText(request.title(), "title", "Title", TITLE_MAX_LENGTH, errors);
		String creator = requiredText(request.creator(), "creator", "Creator", CREATOR_MAX_LENGTH, errors);

		Integer year = request.releaseYear();
		if (year != null && (year < YEAR_MIN || year > YEAR_MAX)) {
			errors.put("releaseYear", "Release year must be between " + YEAR_MIN + " and " + YEAR_MAX + ".");
		}

		String description = TextRules.trimToNull(request.description());
		if (description != null && description.length() > DESCRIPTION_MAX_LENGTH) {
			errors.put("description", tooLong("Description", DESCRIPTION_MAX_LENGTH));
		}

		if (!errors.isEmpty()) {
			throw new InvalidInputException("Some fields are invalid.", errors);
		}
		return new EntryDetails(type, title, creator, year, description);
	}

	private static String requiredText(String raw, String field, String label, int maxLength,
			Map<String, String> errors) {
		String value = TextRules.trimToNull(raw);
		if (value == null) {
			errors.put(field, label + " is required.");
		}
		else if (value.length() > maxLength) {
			errors.put(field, tooLong(label, maxLength));
		}
		return value;
	}

	private static String tooLong(String label, int maxLength) {
		return label + " must be at most " + maxLength + " characters.";
	}
}
