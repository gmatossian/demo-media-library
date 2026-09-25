package demo.medialibrary.demo;

import java.time.Instant;
import java.time.ZoneOffset;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Records whether this database has ever received the demo fixtures. */
@Repository
public class DemoSeedMarker {

	private final JdbcClient jdbc;

	public DemoSeedMarker(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public boolean isSeeded() {
		return jdbc.sql("SELECT COUNT(*) FROM demo_seed").query(Integer.class).single() > 0;
	}

	public void markSeeded(Instant now) {
		jdbc.sql("INSERT INTO demo_seed (id, seeded_at) VALUES (1, :now)")
			.param("now", now.atOffset(ZoneOffset.UTC))
			.update();
	}
}
