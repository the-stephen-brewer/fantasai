# Hardcode your keys here
AWS_ACCESS_KEY_ID=" "
AWS_SECRET_ACCESS_KEY=" "
REGION="us-east-1"
URI=" "

# Run the command using those variables
aws ecr get-login-password \
    --region us-east-1 \
    --profile draftedge-prod \
    | docker login --username AWS --password-stdin  


# 1. Capture the unique Git Hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# 2. Build the image once
docker build -t fantasai:$COMMIT_HASH .

# 3. Create the 'latest' alias (this does not rebuild, just adds a pointer)
docker tag fantasai:$COMMIT_HASH fantasai:latest

# 4. Push both to ECR
# Note: You must use the full ECR URL for the push
ECR_URL=" /fantasai"

docker tag fantasai:$COMMIT_HASH $ECR_URL:$COMMIT_HASH
docker tag fantasai:$COMMIT_HASH $ECR_URL:latest

docker push $ECR_URL:$COMMIT_HASH
docker push $ECR_URL:latest

aws lambda update-function-code \
    --profile draftedge-prod \
    --function-name Draft_Queue_Processing \
    --image-uri  .dkr.ecr.us-east-1.amazonaws.com/fantasai:latest    