#!/bin/bash

## python packaging
# install python libs compatible with linux into a new dir
rm -rf python_libraries
mkdir python_libraries
pip install -r python_scripts/requirements.txt -t python_libraries --platform manylinux2014_x86_64 --only-binary=:all:

# # run unittest
python3 -m pytest python_scripts

# # run linting
cd python_scripts/src
flake8 --exit-zero 

# delete lambda zip if exists
cd ../..
rm -f python_src.zip

# delete glue zip file created for s3 bucket deployment
rm -f python_scripts/gluezip.zip

# create lambda zip
cd python_libraries
zip -r ../python_src.zip ./*

# add python script to lambda zip
cd .. 
zip -r python_src.zip python_scripts -x "*/__pycache__/*"

# create glue zip file (only files we develop)
# DO NOT INCLUDE ADDITIONAL PYTHON LIBRARIES, USE addition-python-modules param instead
cd python_scripts
zip -r gluezip.zip src -x "*/__pycache__/*"
cd ..

# we can use aws s3 cp commands here to copy entire python repo to an existing s3 bucket.
# or create pipeline using aws-codepipeline and create a s3 deploy action


# check if docker image is successfully building
cd python_scripts
docker build -t mycdkimage .
docker run mycdkimage
cd ..



