package demo.medialibrary.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:catalog-api;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class CatalogApiTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	CatalogRepository repository;

	@BeforeEach
	void startWithEmptyCatalog() {
		repository.deleteAll();
	}

	@Test
	void createsTrimmedEntryAndReadsItBack() throws Exception {
		String body = mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON).content("""
				{"type": "BOOK", "title": "  Salt & Circuitry ", "creator": "Idris Venhale",
				 "releaseYear": null, "description": "  "}
				"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.title").value("Salt & Circuitry"))
			.andExpect(content().json("{\"releaseYear\": null, \"description\": null}"))
			.andReturn().getResponse().getContentAsString();
		int id = JsonPath.read(body, "$.id");

		mvc.perform(get("/api/entries/" + id))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Salt & Circuitry"))
			.andExpect(jsonPath("$.createdAt").value(JsonPath.<String>read(body, "$.updatedAt")));
	}

	@Test
	void rejectsInvalidEntryWithFieldErrorsAndCreatesNothing() throws Exception {
		mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"PODCAST\", \"title\": \" \", \"creator\": \"C\", \"releaseYear\": 999}"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.errors.type").exists())
			.andExpect(jsonPath("$.errors.title").value("Title is required."))
			.andExpect(jsonPath("$.errors.releaseYear").exists());

		mvc.perform(get("/api/entries")).andExpect(jsonPath("$", hasSize(0)));
	}

	@ParameterizedTest
	@ValueSource(strings = { "\"\"", "\"1999\"", "1999.5" })
	void releaseYearMustBeJsonIntegerOrNull(String yearJson) throws Exception {
		mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"BOOK\", \"title\": \"T\", \"creator\": \"C\", \"releaseYear\": " + yearJson + "}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.releaseYear").exists());
	}

	@Test
	void updateReplacesDescriptiveFieldsOnly() throws Exception {
		String created = createEntry("BOOK", "The Lighthouse Ledger");
		int id = JsonPath.read(created, "$.id");
		String createdAt = JsonPath.read(created, "$.createdAt");

		String updated = mvc.perform(put("/api/entries/" + id).contentType(MediaType.APPLICATION_JSON).content("""
				{"id": 999, "createdAt": "2000-01-01T00:00:00Z", "updatedAt": "2000-01-01T00:00:00Z",
				 "type": "FILM", "title": "The Lighthouse Ledger", "creator": "Tamsin Okoro", "releaseYear": 1995}
				"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(id))
			.andExpect(jsonPath("$.type").value("FILM"))
			.andExpect(jsonPath("$.creator").value("Tamsin Okoro"))
			.andExpect(jsonPath("$.createdAt").value(createdAt))
			.andReturn().getResponse().getContentAsString();

		Instant updatedAt = Instant.parse(JsonPath.read(updated, "$.updatedAt"));
		assertThat(updatedAt).isAfter(Instant.parse(createdAt));
		mvc.perform(get("/api/entries/999")).andExpect(status().isNotFound());
	}

	@Test
	void duplicateEntriesKeepIndependentIdentity() throws Exception {
		int first = JsonPath.read(createEntry("ALBUM", "Evening Static"), "$.id");
		int second = JsonPath.read(createEntry("ALBUM", "Evening Static"), "$.id");

		mvc.perform(put("/api/entries/" + first).contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"ALBUM\", \"title\": \"Evening Static (Remaster)\", \"creator\": \"C\"}"))
			.andExpect(status().isOk());
		mvc.perform(delete("/api/entries/" + second)).andExpect(status().isNoContent());

		mvc.perform(get("/api/entries/" + first)).andExpect(jsonPath("$.title").value("Evening Static (Remaster)"));
		mvc.perform(get("/api/entries/" + second)).andExpect(status().isNotFound());
		mvc.perform(get("/api/entries")).andExpect(jsonPath("$[*].id", contains(first)));
	}

	@Test
	void missingEntriesAreReportedAsNotFound() throws Exception {
		String validBody = "{\"type\": \"BOOK\", \"title\": \"T\", \"creator\": \"C\"}";
		mvc.perform(get("/api/entries/424242"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.title").value("Entry not found"));
		mvc.perform(put("/api/entries/424242").contentType(MediaType.APPLICATION_JSON).content(validBody))
			.andExpect(status().isNotFound());
		mvc.perform(delete("/api/entries/424242")).andExpect(status().isNotFound());
	}

	@Test
	void searchMatchesTitleLiterallyAndCaseInsensitively() throws Exception {
		createEntry("BOOK", "100% Cotton Clouds");
		createEntry("BOOK", "1000 Cotton Clouds");
		createEntry("FILM", "snake_case Summer");
		createEntry("FILM", "snakeXcase Summer");

		mvc.perform(get("/api/entries").param("q", "%")).andExpect(jsonPath("$[*].title", contains("100% Cotton Clouds")));
		mvc.perform(get("/api/entries").param("q", "_")).andExpect(jsonPath("$[*].title", contains("snake_case Summer")));
		mvc.perform(get("/api/entries").param("q", " COTTON ")).andExpect(jsonPath("$", hasSize(2)));
		mvc.perform(get("/api/entries").param("q", "   ")).andExpect(jsonPath("$", hasSize(4)));
	}

	@Test
	void queryAndTypeCombineAndResultsHaveStableOrder() throws Exception {
		createEntry("ALBUM", "The Dune");
		createEntry("FILM", "dune");
		createEntry("BOOK", "Dune Messiah");
		createEntry("FILM", "Dune");
		int laterDuplicate = JsonPath.read(createEntry("FILM", "dune"), "$.id");
		createEntry("FILM", "Arrival");

		mvc.perform(get("/api/entries").param("q", "dune"))
			.andExpect(jsonPath("$[*].title", contains("dune", "Dune", "dune", "Dune Messiah", "The Dune")))
			.andExpect(jsonPath("$[2].id").value(laterDuplicate));
		mvc.perform(get("/api/entries").param("q", "dune").param("type", "FILM"))
			.andExpect(jsonPath("$[*].title", contains("dune", "Dune", "dune")));
		mvc.perform(get("/api/entries").param("type", "BOOK"))
			.andExpect(jsonPath("$[*].title", contains("Dune Messiah")));
		mvc.perform(get("/api/entries").param("type", "book"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.type").exists());
	}

	private String createEntry(String type, String title) throws Exception {
		return mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"%s\", \"title\": \"%s\", \"creator\": \"Someone\"}".formatted(type, title)))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andReturn().getResponse().getContentAsString();
	}

	/** Advances one second per reading, so update timestamps are distinguishable. */
	@TestConfiguration
	static class SteppingClockConfig {

		@Bean
		@Primary
		Clock steppingClock() {
			return new Clock() {
				private Instant next = Instant.parse("2026-01-01T00:00:00Z");

				@Override
				public synchronized Instant instant() {
					Instant current = next;
					next = next.plus(Duration.ofSeconds(1));
					return current;
				}

				@Override
				public ZoneId getZone() {
					return ZoneOffset.UTC;
				}

				@Override
				public Clock withZone(ZoneId zone) {
					return this;
				}
			};
		}
	}
}
