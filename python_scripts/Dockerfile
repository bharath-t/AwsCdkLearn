# select base image
# FROM python:3.11 - we can use this for local
FROM public.ecr.aws/lambda/python:3.11


# For Local
# set working directory
WORKDIR /app

# copy requirements file to app folder
COPY requirements.txt requirements.txt

# install libraries
RUN pip install -r requirements.txt

# copy contents of root python folder to /app folder
COPY . .

# For Lambda
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt -t ${LAMBDA_TASK_ROOT} --platform manylinux2014_x86_64 --only-binary=:all:
COPY . /${LAMBDA_TASK_ROOT}


# local
# execute python script in local, for lambda, pass cmd as argument to code with lambda_handler path
CMD ["python", "src/lambda2.py"]

# for lambda, cmd will be overridden by cmd param in code
