from src.utils.utils import d_mul


def lambda_handler(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_mul(2, 3),
        'lambda2output1': 'Y'
    }


def lambda_handler2(event, context):
    """
    dummy string
    """
    print(event, context)
    print(event['lambda1output1'])
    return {
        'statusCode': 200,
        'body': d_mul(4, 5)
    }


if __name__ == "__main__":
    lambda_handler({'lambda1output1': 2}, 'b')
