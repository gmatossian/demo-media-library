package demo.medialibrary.catalog;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Input that breaks a catalog rule: a general message plus per-field messages. */
public class InvalidInputException extends RuntimeException {

	private final Map<String, String> fieldErrors;

	public InvalidInputException(String message, Map<String, String> fieldErrors) {
		super(message);
		this.fieldErrors = Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors));
	}

	public Map<String, String> fieldErrors() {
		return fieldErrors;
	}
}
