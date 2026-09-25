package demo.medialibrary.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class EntryValidatorTest {

	@Test
	void trimsUnicodeWhitespaceAndStoresBlankOptionalTextAsNull() {
		EntryDetails details = EntryValidator.validate(
				new EntryRequest(" FILM\n", "  Glass Harbour 　", "\tAnouk Brevik ", null, " \n "));

		assertThat(details).isEqualTo(new EntryDetails(MediaType.FILM, "Glass Harbour", "Anouk Brevik", null, null));
	}

	@Test
	void keepsInnerWhitespaceAndLineBreaksInDescription() {
		EntryDetails details = EntryValidator.validate(
				new EntryRequest("BOOK", "A  B", "C", 2000, "\n line one\n\nline two  \n"));

		assertThat(details.title()).isEqualTo("A  B");
		assertThat(details.description()).isEqualTo("line one\n\nline two");
	}

	@Test
	void reportsEveryMissingRequiredField() {
		assertThatThrownBy(() -> EntryValidator.validate(new EntryRequest(null, "   ", "", null, null)))
			.isInstanceOfSatisfying(InvalidInputException.class, ex -> assertThat(ex.fieldErrors())
				.containsOnlyKeys("type", "title", "creator"));
	}

	@Test
	void typeMustBeAnExactKnownValue() {
		assertThatThrownBy(() -> EntryValidator.validate(new EntryRequest("book", "T", "C", null, null)))
			.isInstanceOfSatisfying(InvalidInputException.class,
					ex -> assertThat(ex.fieldErrors()).containsOnlyKeys("type"));
	}

	@Test
	void measuresLengthAfterTrimming() {
		String title200 = "t".repeat(200);
		assertThat(EntryValidator.validate(new EntryRequest("BOOK", "  " + title200 + "  ", "C", null, null)).title())
			.isEqualTo(title200);

		assertThatThrownBy(() -> EntryValidator.validate(new EntryRequest("BOOK", title200 + "t", "C", null, null)))
			.isInstanceOfSatisfying(InvalidInputException.class,
					ex -> assertThat(ex.fieldErrors()).containsOnlyKeys("title"));
		assertThatThrownBy(() -> EntryValidator.validate(
				new EntryRequest("BOOK", "T", "C", null, "d".repeat(2001))))
			.isInstanceOfSatisfying(InvalidInputException.class,
					ex -> assertThat(ex.fieldErrors()).containsOnlyKeys("description"));
	}

	@Test
	void releaseYearIsOptionalAndBounded() {
		assertThat(EntryValidator.validate(new EntryRequest("ALBUM", "T", "C", 1000, null)).releaseYear()).isEqualTo(1000);
		assertThat(EntryValidator.validate(new EntryRequest("ALBUM", "T", "C", 2100, null)).releaseYear()).isEqualTo(2100);

		for (int year : new int[] { 999, 2101 }) {
			assertThatThrownBy(() -> EntryValidator.validate(new EntryRequest("ALBUM", "T", "C", year, null)))
				.isInstanceOfSatisfying(InvalidInputException.class,
						ex -> assertThat(ex.fieldErrors()).containsOnlyKeys("releaseYear"));
		}
	}
}
