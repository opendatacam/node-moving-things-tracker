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
              IDF1   IDP   IDR  Rcll  Prcn GT MT PT ML    FP    FN IDs   FM  MOTA  MOTP IDt IDa IDm
MOT17-04-DPM 29.4% 36.6% 24.5% 42.5% 63.5% 83  8 43 32 11616 27366 264  469 17.5% 0.224 110 151  12
OVERALL      29.4% 36.6% 24.5% 42.5% 63.5% 83  8 43 32 11616 27366 264  469 17.5% 0.224 110 151  12
```

### Run full benchmark

In order to benchmark the tracker on all MOT17 training sequences, delete the directory `benchmark` and run

```bash
./benchmark.sh
```

On the first run, the script will download the full MOT17 training benchmark and unpack it. Then, it runs the tracker on each sequence and outputs the evaluation metrics.

```
                IDF1   IDP   IDR  Rcll  Prcn   GT  MT  PT  ML    FP     FN  IDs    FM  MOTA  MOTP  IDt  IDa IDm
MOT17-04-SDP   62.2% 74.8% 53.2% 69.0% 97.1%   83  32  39  12   982  14737  121   367 66.7% 0.152   82   46  12
MOT17-04-DPM   29.4% 36.6% 24.5% 42.5% 63.5%   83   8  43  32 11616  27366  264   469 17.5% 0.224  110  151  12
MOT17-05-DPM   34.3% 48.2% 26.7% 40.2% 72.8%  133   9  63  61  1040   4133   94   150 23.9% 0.257  101   27  39
MOT17-05-FRCNN 44.8% 61.3% 35.3% 51.6% 89.6%  133  24  56  53   414   3347   63    69 44.7% 0.172   82   20  39
MOT17-11-FRCNN 55.4% 74.2% 44.2% 55.3% 92.8%   75  15  34  26   405   4219   45    50 50.5% 0.096   35   22  12
MOT17-05-SDP   43.1% 53.9% 35.9% 58.0% 87.0%  133  31  64  38   597   2905   84   128 48.2% 0.165  108   21  45
MOT17-02-FRCNN 31.6% 52.8% 22.6% 34.6% 81.1%   62   6  25  31  1502  12148   93   127 26.0% 0.126   55   49  11
MOT17-09-FRCNN 43.6% 61.2% 33.8% 53.4% 96.8%   26   6  16   4    95   2481   37    39 50.9% 0.096   27   16   6
MOT17-10-FRCNN 40.0% 46.8% 35.0% 57.9% 77.6%   57  15  35   7  2150   5405  228   311 39.4% 0.162  147   89  16
MOT17-04-FRCNN 49.5% 67.8% 39.0% 53.2% 92.4%   83  17  43  23  2077  22271   93    90 48.6% 0.108   42   56   5
MOT17-13-DPM   28.8% 45.8% 21.0% 27.1% 59.2%  110  10  42  58  2172   8489   75   207  7.8% 0.282   48   42  19
MOT17-13-SDP   60.3% 78.0% 49.1% 54.5% 86.6%  110  43  25  42   980   5294   72   199 45.5% 0.212   70   24  27
MOT17-02-SDP   34.3% 46.8% 27.1% 44.7% 77.1%   62   9  34  19  2468  10275  176   353 30.5% 0.201  114   72  13
MOT17-13-FRCNN 50.4% 61.1% 42.9% 55.9% 79.6%  110  35  46  29  1667   5129  200   259 39.9% 0.169  141   83  34
MOT17-02-DPM   23.3% 44.5% 15.8% 25.7% 72.4%   62   4  19  39  1814  13811  107   218 15.3% 0.260   62   55  12
MOT17-10-SDP   48.9% 56.9% 42.8% 67.4% 89.5%   57  23  30   4  1010   4189  163   290 58.2% 0.205  108   60   9
MOT17-09-DPM   35.1% 35.8% 34.4% 57.6% 59.9%   26   5  19   2  2055   2260   77   161 17.5% 0.275   49   32   7
MOT17-09-SDP   48.5% 63.5% 39.2% 57.6% 93.2%   26   7  17   2   222   2260   46    78 52.5% 0.150   35   18   7
MOT17-10-DPM   30.9% 39.6% 25.3% 41.7% 65.3%   57   7  30  20  2852   7479  119   299 18.6% 0.264   61   66  10
MOT17-11-DPM   46.5% 54.9% 40.3% 53.2% 72.5%   75  10  30  35  1904   4413   52    68 32.5% 0.224   27   31   9
MOT17-11-SDP   53.2% 62.9% 46.2% 66.5% 90.7%   75  19  39  17   646   3161   55   100 59.1% 0.149   40   28  15
OVERALL        43.5% 56.7% 35.3% 50.8% 81.6% 1638 335 749 554 38668 165772 2264  4032 38.6% 0.174 1544 1008 359
```
