
# Data Validation Utilities

This directory contains utilities for validating various types of data.

## `data_validator.py`

This module provides the `DataValidator` class with static methods for common data validation tasks.

### `DataValidator` Class Methods:

- `is_not_empty(value, field_name="Value")`: Checks if a value is not `None` and not an empty string, list, or dictionary.
- `is_type(value, expected_type, field_name="Value")`: Checks if a value is of the `expected_type`.
- `is_in_range(value, min_val, max_val, field_name="Value")`: Checks if a numeric value is within a specified inclusive range.
- `matches_regex(value, pattern, field_name="Value")`: Checks if a string value matches a given regular expression pattern.
- `is_email(value, field_name="Email")`: Checks if a string is a valid email format.
- `is_url(value, field_name="URL")`: Checks if a string is a valid URL format.

**Usage Examples:**

```python
from data_validation.data_validator import DataValidator

# Check if not empty
print(f"Is 'hello' not empty? {DataValidator.is_not_empty('hello')}")
print(f"Is '' not empty? {DataValidator.is_not_empty('', 'Name')}")

# Check type
print(f"Is 123 an int? {DataValidator.is_type(123, int)}")
print(f"Is '123' an int? {DataValidator.is_type('123', int, 'Age')}")

# Check range
print(f"Is 5 in range [1, 10]? {DataValidator.is_in_range(5, 1, 10)}")
print(f"Is 15 in range [1, 10]? {DataValidator.is_in_range(15, 1, 10, 'Score')}")

# Check email format
print(f"Is 'test@example.com' a valid email? {DataValidator.is_email('test@example.com')}")
print(f"Is 'invalid-email' a valid email? {DataValidator.is_email('invalid-email')}")

# Check URL format
print(f"Is 'https://www.google.com' a valid URL? {DataValidator.is_url('https://www.google.com')}")
print(f"Is 'not-a-url' a valid URL? {DataValidator.is_url('not-a-url')}")
```
