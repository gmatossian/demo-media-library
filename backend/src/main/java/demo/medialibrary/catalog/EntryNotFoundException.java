package demo.medialibrary.catalog;

public class EntryNotFoundException extends RuntimeException {

	public EntryNotFoundException(long id) {
		super("No catalog entry has id " + id + ".");
	}
}
