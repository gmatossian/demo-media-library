package demo.medialibrary.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import demo.medialibrary.MediaLibraryApplication;
import demo.medialibrary.catalog.CatalogEntry;
import demo.medialibrary.catalog.CatalogFilter;
import demo.medialibrary.catalog.CatalogService;
import demo.medialibrary.catalog.EntryRequest;

/** Starts the real application several times against one file database. */
class RestartDurabilityTest {

	@TempDir
	Path dataDir;

	@Test
	void seedsOnlyANewDatabaseAndKeepsDataAcrossRestarts() {
		int fixtureCount;
		try (var app = start()) {
			CatalogService catalog = app.getBean(CatalogService.class);
			fixtureCount = app.getBean(FixtureCatalog.class).entries().size();
			assertThat(catalog.list(CatalogFilter.NONE)).hasSize(fixtureCount);
			catalog.list(CatalogFilter.NONE).forEach(entry -> catalog.delete(entry.id()));
		}

		try (var app = start()) {
			CatalogService catalog = app.getBean(CatalogService.class);
			assertThat(catalog.list(CatalogFilter.NONE)).as("emptied catalog is not re-seeded").isEmpty();
			catalog.create(new EntryRequest("BOOK", "Survives restarts", "Me", 2026, null));
		}

		try (var app = start()) {
			assertThat(app.getBean(CatalogService.class).list(CatalogFilter.NONE))
				.extracting(CatalogEntry::title)
				.containsExactly("Survives restarts");
		}
	}

	private ConfigurableApplicationContext start() {
		// Command-line arguments override application.properties; builder defaults would not.
		return new SpringApplicationBuilder(MediaLibraryApplication.class)
			.run("--spring.main.web-application-type=none", "--app.data-dir=" + dataDir);
	}
}
