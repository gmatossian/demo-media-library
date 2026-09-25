package demo.medialibrary.catalog;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

/** SQL access to the {@code catalog_entry} table. */
@Repository
public class CatalogRepository {

	private static final String COLUMNS =
			"id, type, title, creator, release_year, description, created_at, updated_at";

	private final JdbcClient jdbc;

	public CatalogRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/**
	 * Entries matching the filter, ordered by case-insensitive title then id.
	 * LOCATE matches the query as a literal substring, so characters such as
	 * {@code %} and {@code _} have no special meaning.
	 */
	public List<CatalogEntry> find(CatalogFilter filter) {
		StringBuilder sql = new StringBuilder("SELECT " + COLUMNS + " FROM catalog_entry WHERE 1 = 1");
		var params = new HashMap<String, Object>();
		if (filter.query() != null) {
			sql.append(" AND LOCATE(LOWER(:query), LOWER(title)) > 0");
			params.put("query", filter.query());
		}
		if (filter.type() != null) {
			sql.append(" AND type = :type");
			params.put("type", filter.type().name());
		}
		sql.append(" ORDER BY LOWER(title), id");
		return jdbc.sql(sql.toString()).params(params).query(CatalogRepository::mapRow).list();
	}

	public Optional<CatalogEntry> findById(long id) {
		return jdbc.sql("SELECT " + COLUMNS + " FROM catalog_entry WHERE id = :id")
			.param("id", id)
			.query(CatalogRepository::mapRow)
			.optional();
	}

	public CatalogEntry insert(EntryDetails details, Instant now) {
		var keys = new GeneratedKeyHolder();
		jdbc.sql("""
				INSERT INTO catalog_entry (type, title, creator, release_year, description, created_at, updated_at)
				VALUES (:type, :title, :creator, :releaseYear, :description, :now, :now)
				""")
			.params(detailParams(details))
			.param("now", toDb(now))
			.update(keys, "id");
		long id = keys.getKeyAs(Long.class);
		return new CatalogEntry(id, details.type(), details.title(), details.creator(), details.releaseYear(),
				details.description(), now, now);
	}

	/** Replaces descriptive fields; id and created_at are never written. */
	public boolean update(long id, EntryDetails details, Instant now) {
		int rows = jdbc.sql("""
				UPDATE catalog_entry
				SET type = :type, title = :title, creator = :creator, release_year = :releaseYear,
				    description = :description, updated_at = :now
				WHERE id = :id
				""")
			.params(detailParams(details))
			.param("now", toDb(now))
			.param("id", id)
			.update();
		return rows == 1;
	}

	public boolean delete(long id) {
		return jdbc.sql("DELETE FROM catalog_entry WHERE id = :id").param("id", id).update() == 1;
	}

	public void deleteAll() {
		jdbc.sql("DELETE FROM catalog_entry").update();
	}

	private static Map<String, Object> detailParams(EntryDetails details) {
		var params = new HashMap<String, Object>();
		params.put("type", details.type().name());
		params.put("title", details.title());
		params.put("creator", details.creator());
		params.put("releaseYear", details.releaseYear());
		params.put("description", details.description());
		return params;
	}

	private static OffsetDateTime toDb(Instant instant) {
		return instant.atOffset(ZoneOffset.UTC);
	}

	private static CatalogEntry mapRow(ResultSet rs, int rowNum) throws SQLException {
		return new CatalogEntry(
				rs.getLong("id"),
				MediaType.valueOf(rs.getString("type")),
				rs.getString("title"),
				rs.getString("creator"),
				rs.getObject("release_year", Integer.class),
				rs.getString("description"),
				rs.getObject("created_at", OffsetDateTime.class).toInstant(),
				rs.getObject("updated_at", OffsetDateTime.class).toInstant());
	}
}
