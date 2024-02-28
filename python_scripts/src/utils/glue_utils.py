from pyspark.sql import SparkSession
from pyspark.conf import SparkConf
from pyspark import SparkContext


def execute_spark_sql(query: str):
    conf = (SparkConf()
            .setAppName("my-test-app")
            .set("spark.driver.maxResultSize", "4g")
            )
    sc = SparkContext.getOrCreate(conf=conf)
    spark = SparkSession(sc)
    spark.sql("set hive.exec.dynamic.partition.mode=nonstrict")
    df = spark.sql(query)
    print(df)
    return df
