import pandas as pd


def lambda_handler(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_sum(1, 2),
        'lambda1output1': 1,
    }


def d_sum(a, b):
    """
    dummy string
    """
    return a + b
