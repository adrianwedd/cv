
# Configuration Management Utilities

This directory contains utilities for managing application configurations.

## `config_manager.py`

This module provides the `ConfigManager` class, which allows for flexible configuration loading from `.ini` files and environment variables. Environment variables take precedence over values in the configuration file.

### `ConfigManager(config_file=None)`

Initializes the `ConfigManager`. If `config_file` is provided and exists, it attempts to load configurations from it.

**Example `config.ini`:**

```ini
[API_SETTINGS]
api_key = your_default_api_key
base_url = https://api.example.com

[APP_SETTINGS]
debug_mode = True
max_retries = 5
```

**Usage:**

```python
from config_manager.config_manager import ConfigManager
import os

# Create a dummy config file for demonstration
with open('my_app_config.ini', 'w') as f:
    f.write('[API_SETTINGS]\n')
    f.write('api_key = default_key_from_file\n')
    f.write('base_url = https://default.example.com\n\n')
    f.write('[APP_SETTINGS]\n')
    f.write('debug_mode = True\n')
    f.write('max_retries = 3\n')

config = ConfigManager('my_app_config.ini')

# Accessing configurations
# Environment variable will override file value if set
os.environ['API_SETTINGS_API_KEY'] = 'key_from_env'
api_key = config.get('API_SETTINGS', 'api_key')
print(f"API Key: {api_key}") # Output: API Key: key_from_env

base_url = config.get('API_SETTINGS', 'base_url')
print(f"Base URL: {base_url}") # Output: Base URL: https://default.example.com

debug_mode = config.get_boolean('APP_SETTINGS', 'debug_mode')
print(f"Debug Mode: {debug_mode}") # Output: Debug Mode: True

max_retries = config.get_int('APP_SETTINGS', 'max_retries', default=10)
print(f"Max Retries: {max_retries}") # Output: Max Retries: 3

# Clean up dummy config file
os.remove('my_app_config.ini')
```

### Methods:

- `get(section, option, default=None)`: Retrieves a configuration value. Prioritizes environment variables (e.g., `SECTION_OPTION`) over the config file. Returns `default` if not found.
- `get_int(section, option, default=None)`: Retrieves an integer configuration value. Handles type conversion and provides error logging for invalid types.
- `get_boolean(section, option, default=None)`: Retrieves a boolean configuration value. Recognizes 'true', '1', 't', 'y', 'yes' as `True` (case-insensitive).


