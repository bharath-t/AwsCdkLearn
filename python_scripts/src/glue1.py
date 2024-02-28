from src.utils.glue_utils import execute_spark_sql
from awsglue.utils import getResolvedOptions
import sys

def process1(stage, query):
    print(stage)
    execute_spark_sql(query)
    return 1


if __name__ == "__main__":
    args = getResolvedOptions(sys.argv, ["stage"])
    stage = args['stage']
    query = 'select * from testdb.test2'
    print(process1(stage, query))


