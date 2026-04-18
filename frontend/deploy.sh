#!/bin/sh

rm -rf ../website-flows-requests
cp -rf ./frontend/out/ ../website-flows-requests
cd ../website-flows-requests
git init
git remote add website git@github.com:Flow-requests/Flow-requests.github.io.git
git add .
git commit -m "deploying website"
git push -f website master