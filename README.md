# node-tracker-by-detections

Tracker by detections wrote in javascript for node.js / browsers


Example DO IOU Tracker to adapt

```
./demo.py -h
usage: demo.py [-h] -d DETECTION_PATH -o OUTPUT_PATH [-sl SIGMA_L]
               [-sh SIGMA_H] [-si SIGMA_IOU] [-tm T_MIN]

IOU Tracker demo script

optional arguments:
  -h, --help            show this help message and exit
  -d DETECTION_PATH, --detection_path DETECTION_PATH
                        full path to CSV file containing the detections
  -o OUTPUT_PATH, --output_path OUTPUT_PATH
                        output path to store the tracking results (MOT
                        challenge devkit compatible format)
  -sl SIGMA_L, --sigma_l SIGMA_L
                        low detection threshold
  -sh SIGMA_H, --sigma_h SIGMA_H
                        high detection threshold
  -si SIGMA_IOU, --sigma_iou SIGMA_IOU
                        intersection-over-union threshold
  -tm T_MIN, --t_min T_MIN
                        minimum track length
```
