
import unittest
from unittest.mock import patch, Mock
from src.python.api_clients.github_api_client import GitHubApiClient

class TestGitHubApiClient(unittest.TestCase):

    def setUp(self):
        self.client = GitHubApiClient(token="test_token", owner="test_owner", repo="test_repo")

    @patch('requests.get')
    def test_get_commits(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = [{"sha": "123"}]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        commits = self.client.get_commits()
        self.assertEqual(len(commits), 1)
        self.assertEqual(commits[0]['sha'], '123')

    @patch('requests.get')
    def test_get_issues(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = [{"id": 1, "title": "Test Issue"}]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        issues = self.client.get_issues()
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]['title'], 'Test Issue')

if __name__ == '__main__':
    unittest.main()
