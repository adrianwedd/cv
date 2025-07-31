import unittest
from unittest.mock import patch, Mock
from src.python.cloud_storage.rclone_client import RcloneClient
import subprocess

class TestRcloneClient(unittest.TestCase):

    def setUp(self):
        self.client = RcloneClient(rclone_path="rclone")

    @patch('subprocess.run')
    def test_lsf(self, mock_run):
        mock_result = Mock()
        mock_result.stdout = "file1.txt\nfile2.pdf\n"
        mock_result.stderr = ""
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        files = self.client.lsf("myremote:path/to/dir")
        self.assertEqual(files, ["file1.txt", "file2.pdf"])
        mock_run.assert_called_once_with(
            ["rclone", "lsf", "myremote:path/to/dir"],
            capture_output=True, text=True, check=True
        )

    @patch('subprocess.run')
    def test_copy(self, mock_run):
        mock_result = Mock()
        mock_result.stdout = ""
        mock_result.stderr = ""
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        self.client.copy("myremote:path/to/file.txt", "/local/path/")
        mock_run.assert_called_once_with(
            ["rclone", "copy", "myremote:path/to/file.txt", "/local/path/"],
            capture_output=True, text=True, check=True
        )

    @patch('subprocess.run')
    def test_lsf_with_filters(self, mock_run):
        mock_result = Mock()
        mock_result.stdout = "filtered_file.txt\n"
        mock_result.stderr = ""
        mock_result.returncode = 0
        mock_run.return_value = mock_result

        files = self.client.lsf("myremote:path", include_filters=["*.txt"], recursive=True)
        self.assertEqual(files, ["filtered_file.txt"])
        mock_run.assert_called_once_with(
            ["rclone", "lsf", "myremote:path", "--recursive", "--include=*.txt"],
            capture_output=True, text=True, check=True
        )

    @patch('subprocess.run')
    def test_command_not_found(self, mock_run):
        mock_run.side_effect = FileNotFoundError
        with self.assertRaises(FileNotFoundError):
            self.client.lsf("myremote:path")

    @patch('subprocess.run')
    def test_command_error(self, mock_run):
        mock_run.side_effect = subprocess.CalledProcessError(1, "rclone lsf", output="", stderr="Error")
        with self.assertRaises(subprocess.CalledProcessError):
            self.client.lsf("myremote:path")

if __name__ == '__main__':
    unittest.main()
