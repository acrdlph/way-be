#!/bin/sh

echo "Building docker image"

docker build -t waitlist-be .

echo "Tagging image"

CURRENT_HASH="$(git rev-parse --abbrev-ref HEAD)-$(git rev-parse HEAD | cut -c1-6)"

echo "current hash is $CURRENT_HASH"

docker tag waitlist-be 614992511822.dkr.ecr.eu-central-1.amazonaws.com/waitlist-be:$CURRENT_HASH

echo "Pushing image to repo"

docker push 614992511822.dkr.ecr.eu-central-1.amazonaws.com/waitlist-be:$CURRENT_HASH

#echo "Deploying to eu-dev"