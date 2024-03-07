import pandas as pd


def lambda_handler(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_sum(event['key1'], event['key2']),
        'lambda1output1': 1,
    }


def d_sum(a, b):
    """
    dummy string
    """
    return a + b
