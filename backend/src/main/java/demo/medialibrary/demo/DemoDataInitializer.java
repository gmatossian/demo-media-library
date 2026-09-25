package demo.medialibrary.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Seeds a brand-new database at startup; existing data is left untouched. */
@Component
class DemoDataInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

	private final DemoDataService demoData;

	DemoDataInitializer(DemoDataService demoData) {
		this.demoData = demoData;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (demoData.seedIfNew()) {
			log.info("New database: loaded demo fixtures.");
		}
		else {
			log.info("Existing database: keeping current catalog data.");
		}
	}
}
