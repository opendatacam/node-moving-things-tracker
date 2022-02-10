#!/usr/bin/env bash

if [ ! -d "benchmark" ]; then
    wget -nc https://motchallenge.net/data/MOT17Labels.zip
    unzip MOT17Labels.zip "train/*" -d "benchmark" && mv "benchmark/train" "benchmark/MOT17"
fi

for d in benchmark/MOT17/*/ ; do
    node main.js --mode motchallenge --input "${d}det/det.txt" && \
    mv "${d}/det/outputTrackerMOT.txt" "benchmark/MOT17/$(basename ${d}).txt"
done

pushd benchmark/MOT17
python3 -m motmetrics.apps.eval_motchallenge . .
popd
