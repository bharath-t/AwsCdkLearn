from src.utils.glue_utils import execute_spark_sql
from awsglue.utils import getResolvedOptions
import sys


def process1(stage, query):
    print(stage)
    df = execute_spark_sql(query)
    return {'row_count': df.count()}


if __name__ == "__main__":
    args = getResolvedOptions(sys.argv, ["stage", "lambda2output1"])
    stage = args['stage']
    lambda2output1 = args['lambda2output1']
    print(lambda2output1)
    query = 'select * from testdb.test2'
    process1(stage, query)
