package demo.medialibrary.catalog;

import java.util.regex.Pattern;

/**
 * Whitespace handling shared by every text input. Mirrors
 * {@code frontend/src/app/catalog/text-rules.ts}: both remove leading and
 * trailing characters with the Unicode White_Space property.
 */
public final class TextRules {

	private static final Pattern EDGE_WHITESPACE =
			Pattern.compile("^\\p{IsWhite_Space}+|\\p{IsWhite_Space}+$");

	private TextRules() {
	}

	/** Trimmed text, or {@code null} when the input is null or blank. */
	public static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = EDGE_WHITESPACE.matcher(value).replaceAll("");
		return trimmed.isEmpty() ? null : trimmed;
	}
}
