package demo.medialibrary.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

import demo.medialibrary.catalog.EntryNotFoundException;
import demo.medialibrary.catalog.InvalidInputException;

/**
 * Maps errors to RFC 9457 problem details. Validation problems add an
 * {@code errors} object of field name to message.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler
	ProblemDetail handleInvalidInput(InvalidInputException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
		problem.setTitle("Invalid request");
		problem.setProperty("errors", ex.fieldErrors());
		return problem;
	}

	@ExceptionHandler
	ProblemDetail handleNotFound(EntryNotFoundException ex) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
		problem.setTitle("Entry not found");
		return problem;
	}

	@ExceptionHandler
	ProblemDetail handleUnexpected(Exception ex) {
		log.error("Unexpected error while handling request", ex);
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
				"The server could not complete the request.");
		problem.setTitle("Server error");
		return problem;
	}

	/** Malformed JSON or a value of the wrong JSON type, e.g. {@code "releaseYear": ""}. */
	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
				"The request body is not valid JSON of the expected shape.");
		problem.setTitle("Invalid request");
		Map<String, String> errors = new LinkedHashMap<>();
		if (ex.getCause() instanceof MismatchedInputException mismatch) {
			mismatch.getPath().stream()
				.map(JacksonException.Reference::getPropertyName)
				.filter(name -> name != null)
				.findFirst()
				.ifPresent(field -> errors.put(field, "Value has the wrong type."));
		}
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
	}
}
