package demo.medialibrary.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import demo.medialibrary.catalog.CatalogEntry;
import demo.medialibrary.catalog.CatalogFilter;
import demo.medialibrary.catalog.CatalogRepository;
import demo.medialibrary.catalog.EntryRequest;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:demo-reset;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class DemoResetTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	FixtureCatalog fixtures;

	@MockitoSpyBean
	CatalogRepository repository;

	@Test
	void resetRestoresFixturesAndNewEntriesCanBeCreatedAfterwards() throws Exception {
		repository.deleteAll();
		mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"BOOK\", \"title\": \"Work in progress\", \"creator\": \"Me\"}"))
			.andExpect(status().isCreated());

		mvc.perform(post("/api/demo/reset")).andExpect(status().isNoContent());

		List<CatalogEntry> afterReset = repository.find(CatalogFilter.NONE);
		assertThat(afterReset).extracting(CatalogEntry::title)
			.containsExactlyInAnyOrderElementsOf(fixtures.entries().stream().map(EntryRequest::title).toList())
			.doesNotContain("Work in progress");

		String created = mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"FILM\", \"title\": \"Made after reset\", \"creator\": \"Me\"}"))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		long newId = ((Number) JsonPath.read(created, "$.id")).longValue();
		assertThat(afterReset).extracting(CatalogEntry::id).doesNotContain(newId);
		mvc.perform(get("/api/entries"))
			.andExpect(jsonPath("$", hasSize(afterReset.size() + 1)));
	}

	@Test
	void failedResetLeavesTheCatalogExactlyAsItWas() throws Exception {
		repository.deleteAll();
		mvc.perform(post("/api/entries").contentType(MediaType.APPLICATION_JSON)
			.content("{\"type\": \"ALBUM\", \"title\": \"Keep me\", \"creator\": \"Me\"}"))
			.andExpect(status().isCreated());
		List<CatalogEntry> before = repository.find(CatalogFilter.NONE);

		// Fail part-way through re-inserting fixtures, after the old rows were deleted.
		AtomicInteger inserts = new AtomicInteger();
		doAnswer(invocation -> {
			if (inserts.incrementAndGet() == 3) {
				throw new IllegalStateException("Simulated failure during reset");
			}
			return invocation.callRealMethod();
		}).when(repository).insert(any(), any());

		mvc.perform(post("/api/demo/reset"))
			.andExpect(status().isInternalServerError())
			.andExpect(jsonPath("$.title").value("Server error"));

		assertThat(inserts.get()).isEqualTo(3);
		assertThat(repository.find(CatalogFilter.NONE)).isEqualTo(before);
	}
}
