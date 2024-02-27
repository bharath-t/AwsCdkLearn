# select base image
# FROM python:3.11 - we can use this for local
FROM public.ecr.aws/lambda/python:3.11

# set working directory
WORKDIR /app

# copy requirements file to app folder
COPY requirements.txt requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# install libraries
RUN pip install -r requirements.txt
RUN pip install -r requirements.txt -t ${LAMBDA_TASK_ROOT} --platform manylinux2014_x86_64 --only-binary=:all:

# copy contents of root python folder to /app folder
COPY . /app
COPY . /${LAMBDA_TASK_ROOT}

# execute python script in local, for lambda, pass cmd as argument to code with lambda_handler path
CMD ["python", "src/lambda2.py"]
