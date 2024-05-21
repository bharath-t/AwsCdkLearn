# select base image
# we can use this for local
# FROM python:3.11 
FROM public.ecr.aws/amazonlinux/amazonlinux:latest

# RUN yum install amazon-linux-extras -y
# RUN amazon-linux-extras install -y python3.9

# default python3 is available on amazonlinux latest
RUN yum install -y python3-pip
RUN pip install setuptools wheel

# For Local
# set working directory
WORKDIR /app

# copy requirements file to app folder
COPY requirements.txt requirements.txt

# install libraries
RUN pip install -r requirements.txt

# copy contents of root python folder to /app folder
COPY . .
