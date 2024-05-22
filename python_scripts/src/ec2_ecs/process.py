import ast
from Transformer import Transformer
import sys

def process(input_dict):
    transformer = Transformer(input_dict)
    transformer.writetoS3()


if __name__ == '__main__':
    input_dict = {
        'inputPath': 's3://input-415283085407/abc.csv',
        'sql': """ select * from inputdf where col1 > 50 """,
        'destPath': 's3://output-415283085407/abc.csv'
    }

    if len(sys.argv) > 1:
        input_dict_string = sys.argv[1]
        # input_dict = json.loads(input_dict_string)
        input_dict = ast.literal_eval(input_dict_string)
    # argv[0] will be current file name always

    process(input_dict)
        

    

