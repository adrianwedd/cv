
import re
from src.python.utils.logging_utils import setup_logger

logger = setup_logger(__name__, 'data_validator.log')

class DataValidator:
    """A utility class for common data validation tasks."""

    @staticmethod
    def is_not_empty(value, field_name="Value"):
        """Checks if a value is not None and not an empty string/list/dict."""
        if value is None:
            logger.warning(f"{field_name} cannot be None.")
            return False
        if isinstance(value, (str, list, dict)) and not value:
            logger.warning(f"{field_name} cannot be empty.")
            return False
        return True

    @staticmethod
    def is_type(value, expected_type, field_name="Value"):
        """Checks if a value is of the expected type."""
        if not isinstance(value, expected_type):
            logger.warning(f"{field_name} must be of type {expected_type.__name__}, but got {type(value).__name__}.")
            return False
        return True

    @staticmethod
    def is_in_range(value, min_val, max_val, field_name="Value"):
        """Checks if a numeric value is within a specified range (inclusive)."""
        if not isinstance(value, (int, float)):
            logger.warning(f"{field_name} must be a number to check range.")
            return False
        if not (min_val <= value <= max_val):
            logger.warning(f"{field_name} ({value}) is not within the range [{min_val}, {max_val}].")
            return False
        return True

    @staticmethod
    def matches_regex(value, pattern, field_name="Value"):
        """Checks if a string value matches a given regular expression pattern."""
        if not isinstance(value, str):
            logger.warning(f"{field_name} must be a string to match regex.")
            return False
        if not re.fullmatch(pattern, value):
            logger.warning(f"{field_name} ('{value}') does not match the required pattern '{pattern}'.")
            return False
        return True

    @staticmethod
    def is_email(value, field_name="Email"):
        """Checks if a string is a valid email format."""
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
        return DataValidator.matches_regex(value, email_regex, field_name)

    @staticmethod
    def is_url(value, field_name="URL"):
        """Checks if a string is a valid URL format."""
        url_regex = r"^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$";
        return DataValidator.matches_regex(value, url_regex, field_name)

