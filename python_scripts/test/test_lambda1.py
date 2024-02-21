from python_scripts.src.lambda1 import d_sum


class TestHandler:
    def test_sum(self):
        result = d_sum(2, 3)
        assert result == 5
