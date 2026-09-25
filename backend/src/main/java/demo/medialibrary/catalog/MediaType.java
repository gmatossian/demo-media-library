package demo.medialibrary.catalog;

import java.util.Arrays;
import java.util.Optional;

/** The kinds of catalog entry the library describes. */
public enum MediaType {
	BOOK, FILM, ALBUM;

	/** Exact, case-sensitive match on the enum name, e.g. {@code "BOOK"}. */
	public static Optional<MediaType> parse(String value) {
		return Arrays.stream(values()).filter(type -> type.name().equals(value)).findFirst();
	}

	public static String allowedValues() {
		return String.join(", ", Arrays.stream(values()).map(Enum::name).toList());
	}
}
