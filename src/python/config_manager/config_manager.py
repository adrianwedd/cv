
import configparser
import os
from src.python.utils.logging_utils import setup_logger

logger = setup_logger(__name__, 'config_manager.log')

class ConfigManager:
    """A class to manage application configurations from .ini files and environment variables."""

    def __init__(self, config_file=None):
        self.config = configparser.ConfigParser()
        self.config_file = config_file
        if self.config_file and os.path.exists(self.config_file):
            try:
                self.config.read(self.config_file)
                logger.info(f"Configuration loaded from {self.config_file}")
            except Exception as e:
                logger.error(f"Error loading configuration from {self.config_file}: {e}")
        else:
            logger.info("No configuration file provided or file does not exist. Relying on environment variables.")

    def get(self, section, option, default=None):
        """Retrieves a configuration value, prioritizing environment variables."""
        env_var_name = f"{section.upper()}_{option.upper()}"
        env_value = os.getenv(env_var_name)
        if env_value is not None:
            return env_value
        
        try:
            return self.config.get(section, option)
        except (configparser.NoSectionError, configparser.NoOptionError):
            logger.warning(f"Configuration option '{option}' not found in section '{section}'. Using default value: {default}")
            return default

    def get_int(self, section, option, default=None):
        """Retrieves an integer configuration value, prioritizing environment variables."""
        value = self.get(section, option, default)
        if value is not None:
            try:
                return int(value)
            except ValueError:
                logger.error(f"Configuration option '{option}' in section '{section}' is not a valid integer. Value: {value}")
                return default
        return default

    def get_boolean(self, section, option, default=None):
        """Retrieves a boolean configuration value, prioritizing environment variables."""
        value = self.get(section, option, default)
        if value is not None:
            return str(value).lower() in ('true', '1', 't', 'y', 'yes')
        return default

