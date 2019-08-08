## MOT Challenge

_This might need to live in the `node-tracker-moving-things` repo_

### Install tool

Follow this guide: https://github.com/cheind/py-motmetrics#installation

Use python3 and pip3

```
pip3 install motmetrics
```

### Run tool

You need to prepare a folder with ground truth data, and test data (tracker data to benchmark)

```
.
├── SEQUENCE_NAME
│   └── gt
│       └── gt.txt
└── SEQUENCE_NAME.txt
```

`SEQUENCE_NAME.txt` is the tracker data to test, and `gt.txt` is the ground truth.
 


```
python3 -m motmetrics.apps.eval_motchallenge <PATH_TO_SEQUENCE_NAME> <PATH_TO_SEQUENCE_NAME> 

# Complete doc
python3 -m motmetrics.apps.eval_motchallenge --help
```
