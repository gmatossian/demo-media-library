package demo.medialibrary.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoDataController {

	private final DemoDataService demoData;

	public DemoDataController(DemoDataService demoData) {
		this.demoData = demoData;
	}

	/** Replaces all catalog entries with the fictional sample catalog. */
	@PostMapping("/reset")
	public ResponseEntity<Void> reset() {
		demoData.reset();
		return ResponseEntity.noContent().build();
	}
}
