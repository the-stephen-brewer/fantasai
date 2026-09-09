export AWS_PROFILE=draftedge-prod
docker build -t my-lambda-test-image .
docker run \
  --rm \
  --read-only \
  --tmpfs /tmp \
  -p 9000:8080 \
  -v ~/.aws:/root/.aws \
  -e AWS_PROFILE=draftedge-prod \
  -e AWS_LAMBDA_FUNCTION_NAME=local-test-function \
  my-lambda-test-image