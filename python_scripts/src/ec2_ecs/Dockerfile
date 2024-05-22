# select base image
# we can use this for local
# FROM python:3.11 
FROM public.ecr.aws/amazonlinux/amazonlinux:latest

# RUN yum install amazon-linux-extras -y
# RUN amazon-linux-extras install -y python3.9

WORKDIR /app

# default python3 is available on amazonlinux latest
RUN yum upgrade -y && yum install -y python3 python3-pip
RUN pip install setuptools wheel

# For Local
# set working directory

# copy requirements file to app folder
COPY requirements.txt requirements.txt

# install libraries
RUN pip install -r requirements.txt

# copy contents of root python folder to /app folder
COPY . .

# MUST. You will be unable to locate python3, cant pass it in CMD. Instead use entrypoint, just pass module name in CMD.
ENTRYPOINT [ "python3" ]

# CMD ["process.py"]

