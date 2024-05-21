import pandas as pd
from pandasql import sqldf
import boto3
import io


class Transformer:
    def __init__(self, inputDict):
        self.inputDict = inputDict
        self.s3_client = boto3.client('s3')

    def readCSVFromS3(self):
        bucket_name, file_key = self.inputDict['inputPath'].split("//", 1)[1].split("/", 1)
        try:
            s3_object = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
            df = pd.read_csv(s3_object['Body'], dtype=str)
            return df
        except Exception as e:
            raise e
    
    def writetoS3(self):
        inputdf = self.readCSVFromS3()
        df2 = sqldf(self.inputDict['sql'])
        bucket_name, file_key = self.inputDict['destPath'].split("//", 1)[1].split("/", 1)
        try:
            csv_buffer = df2.to_csv(index=False)
            self.s3_client.put_object(Body=csv_buffer.encode('utf-8'), Bucket=bucket_name, Key=file_key)
            print(f'File written to s3 at path {bucket_name, file_key}')

        except Exception as e:
            raise e
    

