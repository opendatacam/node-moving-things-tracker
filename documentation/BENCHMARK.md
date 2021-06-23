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

### Run full benchmark

In order to benchmark the tracker on all MOT17 training sequences, delete the directory `benchmark` and run

```bash
./benchmark.sh
```

On the first run, the script will download the full MOT17 training benchmark and unpack it. Then, it runs the tracker on each sequence and outputs the evaluation metrics.

```
                IDF1   IDP   IDR  Rcll  Prcn   GT  MT  PT  ML    FP     FN  IDs    FM  MOTA  MOTP  IDt  IDa IDm
MOT17-04-SDP   62.1% 74.7% 53.2% 69.1% 97.0%   83  32  39  12  1018  14708  138   381 66.6% 0.152   82   61  11
MOT17-04-DPM   28.6% 34.4% 24.5% 42.8% 60.0%   83   8  43  32 13558  27210  355   549 13.5% 0.224  110  240  10
MOT17-05-DPM   34.2% 45.9% 27.3% 41.7% 70.1%  133   9  68  56  1227   4035  131   182 22.0% 0.258  101   57  34
MOT17-05-FRCNN 45.0% 60.4% 35.9% 52.3% 87.9%  133  24  64  45   498   3302   74    79 44.0% 0.173   83   27  36
MOT17-11-FRCNN 55.1% 72.8% 44.4% 55.7% 91.5%   75  15  36  24   491   4177   57    59 49.9% 0.097   37   33  13
MOT17-05-SDP   43.2% 52.7% 36.6% 59.2% 85.2%  133  32  75  26   712   2823  102   146 47.4% 0.167  109   36  43
MOT17-02-FRCNN 31.5% 52.4% 22.6% 34.8% 80.7%   62   6  25  31  1547  12123  107   138 25.9% 0.127   59   60  12
MOT17-09-FRCNN 43.5% 60.8% 33.8% 53.6% 96.4%   26   6  16   4   107   2473   41    42 50.8% 0.096   27   19   5
MOT17-10-FRCNN 39.5% 45.3% 35.0% 58.6% 75.8%   57  15  35   7  2395   5318  279   342 37.8% 0.164  156  124  13
MOT17-04-FRCNN 49.5% 67.6% 39.0% 53.2% 92.4%   83  17  43  23  2092  22240  105   101 48.6% 0.108   42   67   4
MOT17-13-DPM   27.4% 38.9% 21.1% 28.6% 52.6%  110  11  44  55  3000   8313  164   292  1.4% 0.282   50  126  16
MOT17-13-SDP   59.4% 74.9% 49.3% 55.2% 83.9%  110  44  28  38  1235   5210  133   238 43.5% 0.213   82   71  25
MOT17-02-SDP   34.0% 45.5% 27.1% 45.3% 76.0%   62   9  35  18  2663  10166  233   401 29.7% 0.202  117  122  10
MOT17-13-FRCNN 49.3% 57.6% 43.1% 57.0% 76.4%  110  35  49  26  2053   5001  275   322 37.0% 0.172  160  137  33
MOT17-02-DPM   23.0% 42.1% 15.8% 26.5% 70.5%   62   4  20  38  2063  13662  168   270 14.5% 0.261   65  108   7
MOT17-10-SDP   48.4% 55.5% 42.9% 67.8% 87.8%   57  23  30   4  1211   4138  198   315 56.8% 0.205  114   84   5
MOT17-09-DPM   34.2% 34.0% 34.4% 58.0% 57.3%   26   5  19   2  2303   2238   84   164 13.1% 0.275   49   39   7
MOT17-09-SDP   48.2% 62.0% 39.4% 58.0% 91.4%   26   8  16   2   292   2239   52    83 51.5% 0.150   37   23   8
MOT17-10-DPM   30.0% 36.6% 25.4% 42.8% 61.7%   57   7  30  20  3411   7339  219   388 14.6% 0.266   65  158   9
MOT17-11-DPM   44.1% 48.4% 40.5% 53.8% 64.3%   75  11  32  32  2820   4361   68    82 23.2% 0.225   27   44   6
MOT17-11-SDP   53.0% 62.1% 46.2% 66.8% 89.8%   75  20  38  17   715   3135   76   112 58.4% 0.149   44   41  13
OVERALL        42.9% 54.6% 35.4% 51.3% 79.2% 1638 341 785 512 45411 164211 3059  4686 36.9% 0.175 1616 1677 320
```
