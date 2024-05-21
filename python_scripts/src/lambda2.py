from src.utils.utils import d_mul


def lambda_handler(event, context):
    """
    dummy string
    """
    print(event, context)
    return {
        'statusCode': 200,
        'body': d_mul(event['key1'], event['key2']),
        'lambda2output1': 'Y'
    }


def lambda_handler2(event, context):
    """
    dummy string
    """
    print(event, context)
    print(f"execution id is {context.aws_request_id}")
    print(f"log group is {context.log_group_name}")
    print(f"log stream is {context.log_stream_name}")
    return {
        'statusCode': 200,
        'body': d_mul(event['key1'], event['key2'])
    }


if __name__ == "__main__":
    lambda_handler({'key1': 3,'key2':4}, 'b')
