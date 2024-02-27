from src.utils.utils import d_mul


def lambda_handler(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_mul(2, 3)
    }

def lambda_handler2(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_mul(4, 5)
    }


if __name__ == "__main__":
    lambda_handler('a', 'b')
