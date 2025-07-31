import unittest
import os
from src.python.config_manager.config_manager import ConfigManager

class TestConfigManager(unittest.TestCase):

    def setUp(self):
        self.test_config_file = 'test_config.ini'
        with open(self.test_config_file, 'w') as f:
            f.write('[TEST_SECTION]\n')
            f.write('string_option = file_value\n')
            f.write('int_option = 123\n')
            f.write('bool_option_true = True\n')
            f.write('bool_option_false = False\n')
            f.write('invalid_int = abc\n')

    def tearDown(self):
        if os.path.exists(self.test_config_file):
            os.remove(self.test_config_file)
        # Clean up environment variables set during tests
        for key in ['TEST_SECTION_STRING_OPTION', 'TEST_SECTION_INT_OPTION', 'TEST_SECTION_BOOL_OPTION_TRUE']:
            if key in os.environ:
                del os.environ[key]

    def test_get_from_file(self):
        config = ConfigManager(self.test_config_file)
        self.assertEqual(config.get('TEST_SECTION', 'string_option'), 'file_value')

    def test_get_from_env_overrides_file(self):
        os.environ['TEST_SECTION_STRING_OPTION'] = 'env_value'
        config = ConfigManager(self.test_config_file)
        self.assertEqual(config.get('TEST_SECTION', 'string_option'), 'env_value')

    def test_get_from_env_only(self):
        os.environ['TEST_SECTION_NEW_OPTION'] = 'new_env_value'
        config = ConfigManager()
        self.assertEqual(config.get('TEST_SECTION', 'new_option'), 'new_env_value')

    def test_get_default_value(self):
        config = ConfigManager(self.test_config_file)
        self.assertEqual(config.get('NON_EXISTENT_SECTION', 'option', 'default_val'), 'default_val')
        self.assertEqual(config.get('TEST_SECTION', 'non_existent_option', 'default_val'), 'default_val')

    def test_get_int_from_file(self):
        config = ConfigManager(self.test_config_file)
        self.assertEqual(config.get_int('TEST_SECTION', 'int_option'), 123)

    def test_get_int_from_env_overrides_file(self):
        os.environ['TEST_SECTION_INT_OPTION'] = '456'
        config = ConfigManager(self.test_config_file)
        self.assertEqual(config.get_int('TEST_SECTION', 'int_option'), 456)

    def test_get_int_invalid(self):
        config = ConfigManager(self.test_config_file)
        self.assertIsNone(config.get_int('TEST_SECTION', 'invalid_int'))
        self.assertEqual(config.get_int('TEST_SECTION', 'invalid_int', default=999), 999)

    def test_get_boolean_true(self):
        config = ConfigManager(self.test_config_file)
        self.assertTrue(config.get_boolean('TEST_SECTION', 'bool_option_true'))

    def test_get_boolean_false(self):
        config = ConfigManager(self.test_config_file)
        self.assertFalse(config.get_boolean('TEST_SECTION', 'bool_option_false'))

    def test_get_boolean_from_env_true(self):
        os.environ['TEST_SECTION_BOOL_OPTION_TRUE'] = 'yes'
        config = ConfigManager(self.test_config_file)
        self.assertTrue(config.get_boolean('TEST_SECTION', 'bool_option_true'))

    def test_get_boolean_from_env_false(self):
        os.environ['TEST_SECTION_BOOL_OPTION_TRUE'] = 'no'
        config = ConfigManager(self.test_config_file)
        self.assertFalse(config.get_boolean('TEST_SECTION', 'bool_option_true'))

if __name__ == '__main__':
    unittest.main()
