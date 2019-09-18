## Benchmark against MOT Challenge

_This is still Work in progress, see https://github.com/opendatacam/opendatacam/issues/87_

More background about MOTChallenge: [https://motchallenge.net/](https://motchallenge.net/)

### Install tool

Follow this guide: https://github.com/cheind/py-motmetrics#installation

Use python3 and pip3

```bash
pip3 install motmetrics
```

Install LAP solver which is faster

```bash
pip3 install lap
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
 

```bash
python3 -m motmetrics.apps.eval_motchallenge <PATH_TO_SEQUENCE_NAME> <PATH_TO_SEQUENCE_NAME> 

# See Complete documentation
python3 -m motmetrics.apps.eval_motchallenge --help
```

Example with a training set of MOT17 Challenge:

- Generate tracker data from input detections provided by the MOT Challenge

```bash
node main.js --mode motchallenge --input benchmark/MOT17/MOT17-04-DPM/det/det.txt
```

- Rename the output `outputTrackerMOT.txt` to `MOT17-04-DPM.txt` and move it to `benchmark/MOT17` to comply with motmetrics.app python app requirement

- Run tool on this to get evaluation metrics (takes a bit of time)

```bash
cd benchmark/MOT17
python3 -m motmetrics.apps.eval_motchallenge . .
```

- Result

```
              IDF1   IDP   IDR  Rcll  Prcn GT MT PT ML    FP    FN IDs   FM  MOTA  MOTP
MOT17-04-DPM 28.6% 34.4% 24.5% 42.8% 60.0% 83  8 43 32 13558 27210 355  549 13.5% 0.224
OVERALL      28.6% 34.4% 24.5% 42.8% 60.0% 83  8 43 32 13558 27210 355  549 13.5% 0.224
```
