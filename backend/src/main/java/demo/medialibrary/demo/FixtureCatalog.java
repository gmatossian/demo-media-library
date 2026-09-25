package demo.medialibrary.demo;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import demo.medialibrary.catalog.EntryRequest;

/** The original fictional sample entries kept in source control. */
@Component
public class FixtureCatalog {

	private static final String LOCATION = "fixtures/catalog.json";

	private final JsonMapper json;

	public FixtureCatalog(JsonMapper json) {
		this.json = json;
	}

	public List<EntryRequest> entries() {
		try (InputStream in = new ClassPathResource(LOCATION).getInputStream()) {
			return json.readValue(in, new TypeReference<List<EntryRequest>>() {
			});
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Could not read " + LOCATION, ex);
		}
	}
}
