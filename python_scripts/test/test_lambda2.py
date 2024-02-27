from python_scripts.src.utils.utils import d_mul


class TestHandler2:
    def test_sum(self):
        result = d_mul(2, 3)
        assert result == 6
