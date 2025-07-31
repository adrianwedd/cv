
import unittest
from src.python.data_validation.data_validator import DataValidator

class TestDataValidator(unittest.TestCase):

    def test_is_not_empty(self):
        self.assertTrue(DataValidator.is_not_empty("hello"))
        self.assertTrue(DataValidator.is_not_empty([1, 2]))
        self.assertTrue(DataValidator.is_not_empty({'a': 1}))
        self.assertFalse(DataValidator.is_not_empty(None))
        self.assertFalse(DataValidator.is_not_empty(""))
        self.assertFalse(DataValidator.is_not_empty([]))
        self.assertFalse(DataValidator.is_not_empty({}))

    def test_is_type(self):
        self.assertTrue(DataValidator.is_type("hello", str))
        self.assertTrue(DataValidator.is_type(123, int))
        self.assertTrue(DataValidator.is_type(1.23, float))
        self.assertFalse(DataValidator.is_type("123", int))
        self.assertFalse(DataValidator.is_type(123, str))

    def test_is_in_range(self):
        self.assertTrue(DataValidator.is_in_range(5, 1, 10))
        self.assertTrue(DataValidator.is_in_range(1, 1, 10))
        self.assertTrue(DataValidator.is_in_range(10, 1, 10))
        self.assertFalse(DataValidator.is_in_range(0, 1, 10))
        self.assertFalse(DataValidator.is_in_range(11, 1, 10))
        self.assertFalse(DataValidator.is_in_range("abc", 1, 10))

    def test_matches_regex(self):
        self.assertTrue(DataValidator.matches_regex("abc", "^[a-z]+$"))
        self.assertFalse(DataValidator.matches_regex("123", "^[a-z]+$"))
        self.assertFalse(DataValidator.matches_regex(123, "^[0-9]+$"))

    def test_is_email(self):
        self.assertTrue(DataValidator.is_email("test@example.com"))
        self.assertTrue(DataValidator.is_email("first.last@sub.domain.co.uk"))
        self.assertFalse(DataValidator.is_email("invalid-email"))
        self.assertFalse(DataValidator.is_email("test@.com"))
        self.assertFalse(DataValidator.is_email("test@com"))

    def test_is_url(self):
        self.assertTrue(DataValidator.is_url("http://www.google.com"))
        self.assertTrue(DataValidator.is_url("https://sub.domain.co.uk/path/to/page?query=1#fragment"))
        self.assertTrue(DataValidator.is_url("www.example.com"))
        self.assertFalse(DataValidator.is_url("invalid-url"))
        self.assertFalse(DataValidator.is_url("http://.com"))

if __name__ == '__main__':
    unittest.main()
