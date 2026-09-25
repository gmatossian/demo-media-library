package demo.medialibrary.catalog;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/entries")
public class CatalogController {

	private final CatalogService catalog;

	public CatalogController(CatalogService catalog) {
		this.catalog = catalog;
	}

	@GetMapping
	public List<CatalogEntry> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) String type) {
		return catalog.list(CatalogFilter.of(q, type));
	}

	@GetMapping("/{id}")
	public CatalogEntry get(@PathVariable long id) {
		return catalog.get(id);
	}

	@PostMapping
	public ResponseEntity<CatalogEntry> create(@RequestBody EntryRequest request) {
		CatalogEntry created = catalog.create(request);
		return ResponseEntity.created(URI.create("/api/entries/" + created.id())).body(created);
	}

	@PutMapping("/{id}")
	public CatalogEntry update(@PathVariable long id, @RequestBody EntryRequest request) {
		return catalog.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable long id) {
		catalog.delete(id);
		return ResponseEntity.noContent().build();
	}
}
