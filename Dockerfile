# 1. Use the AWS Lambda Python base image (Choose your version)
FROM public.ecr.aws/lambda/python:3.11

# 2. Copy requirements and install dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

# 3. Copy all your local source files to the container
#    ${LAMBDA_TASK_ROOT} is a built-in variable for /var/task
COPY . ${LAMBDA_TASK_ROOT}

# 4. Set the CMD to your handler (FileName.FunctionName)
CMD [ "controller.lambda_handler" ]