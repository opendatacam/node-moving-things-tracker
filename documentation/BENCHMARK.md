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
              IDF1   IDP   IDR  Rcll  Prcn GT MT PT ML   FP    FN IDs   FM  MOTA  MOTP IDt IDa IDm
MOT17-04-DPM 33.5% 53.8% 24.3% 39.0% 86.4% 83  4 45 34 2924 29004 239  393 32.4% 0.217 106 141  10
OVERALL      33.5% 53.8% 24.3% 39.0% 86.4% 83  4 45 34 2924 29004 239  393 32.4% 0.217 106 141  10
```

### Run full benchmark

In order to benchmark the tracker on all MOT17 training sequences, delete the directory `benchmark` and run

```bash
./benchmark.sh
```

On the first run, the script will download the full MOT17 training benchmark and unpack it. Then, it runs the tracker on each sequence and outputs the evaluation metrics.

```
                IDF1   IDP   IDR  Rcll  Prcn   GT  MT  PT  ML    FP     FN  IDs    FM  MOTA  MOTP  IDt IDa IDm
MOT17-04-SDP   62.2% 74.8% 53.2% 69.0% 97.1%   83  32  39  12   982  14737  121   367 66.7% 0.152   82  46  12
MOT17-04-DPM   33.5% 53.8% 24.3% 39.0% 86.4%   83   4  45  34  2924  29004  239   393 32.4% 0.217  106 141  10
MOT17-05-DPM   36.1% 62.7% 25.3% 35.6% 88.1%  133  11  49  73   333   4456   60   110 29.9% 0.247   65  20  25
MOT17-05-FRCNN 44.8% 61.3% 35.3% 51.6% 89.6%  133  24  56  53   414   3347   63    69 44.7% 0.172   82  20  39
MOT17-11-FRCNN 55.4% 74.2% 44.2% 55.3% 92.8%   75  15  34  26   405   4219   45    50 50.5% 0.096   35  22  12
MOT17-05-SDP   43.1% 53.9% 35.9% 58.0% 87.0%  133  31  64  38   597   2905   84   128 48.2% 0.165  108  21  45
MOT17-02-FRCNN 31.6% 52.8% 22.6% 34.6% 81.1%   62   6  25  31  1502  12148   93   127 26.0% 0.126   55  49  11
MOT17-09-FRCNN 43.6% 61.2% 33.8% 53.4% 96.8%   26   6  16   4    95   2481   37    39 50.9% 0.096   27  16   6
MOT17-10-FRCNN 40.0% 46.8% 35.0% 57.9% 77.6%   57  15  35   7  2150   5405  228   311 39.4% 0.162  147  89  16
MOT17-04-FRCNN 49.5% 67.8% 39.0% 53.2% 92.4%   83  17  43  23  2077  22271   93    90 48.6% 0.108   42  56   5
MOT17-13-DPM   24.9% 69.5% 15.2% 19.1% 87.6%  110   8  25  77   316   9416   35   102 16.1% 0.272   25  25  15
MOT17-13-SDP   60.3% 78.0% 49.1% 54.5% 86.6%  110  43  25  42   980   5294   72   199 45.5% 0.212   70  24  27
MOT17-02-SDP   34.3% 46.8% 27.1% 44.7% 77.1%   62   9  34  19  2468  10275  176   353 30.5% 0.201  114  72  13
MOT17-13-FRCNN 50.4% 61.1% 42.9% 55.9% 79.6%  110  35  46  29  1667   5129  200   259 39.9% 0.169  141  83  34
MOT17-02-DPM   22.8% 64.0% 13.9% 18.8% 86.6%   62   3  15  44   541  15090   47   103 15.6% 0.247   23  29   5
MOT17-10-SDP   48.9% 56.9% 42.8% 67.4% 89.5%   57  23  30   4  1010   4189  163   290 58.2% 0.205  108  60   9
MOT17-09-DPM   42.3% 52.8% 35.3% 53.3% 79.6%   26   2  19   5   725   2489   72   164 38.3% 0.273   50  23   5
MOT17-09-SDP   48.5% 63.5% 39.2% 57.6% 93.2%   26   7  17   2   222   2260   46    78 52.5% 0.150   35  18   7
MOT17-10-DPM   29.4% 49.6% 20.9% 36.1% 85.9%   57   7  18  32   762   8198   77   141 29.6% 0.251   36  48   8
MOT17-11-DPM   50.3% 72.6% 38.5% 49.7% 93.6%   75   9  25  41   323   4748   45    58 45.8% 0.219   31  26  12
MOT17-11-SDP   53.2% 62.9% 46.2% 66.5% 90.7%   75  19  39  17   646   3161   55   100 59.1% 0.149   40  28  15
OVERALL        44.7% 62.6% 34.7% 49.2% 88.7% 1638 326 699 613 21139 171222 2051  3531 42.3% 0.170 1422 916 331
```
