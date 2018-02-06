#! /usr/bin/env node
var fs  = require("fs");
var Tracker = require('./tracker');
// Utilities for cleaning up detections input
var isInsideSomeAreas = require('./utils').isInsideSomeAreas;
var ignoreObjectsNotToDetect = require('./utils').ignoreObjectsNotToDetect;
var isDetectionTooLarge = require('./utils').isDetectionTooLarge;

// Export Tracker API to use as a node module
exports.Tracker = Tracker

// Parse CLI args
var args = process.argv.slice(2);
// Path to raw detections input
var pathRawDetectionsInput = args[0];

// If input path not specified abort
if(!pathRawDetectionsInput) {
  console.error('Please specify the path to the raw detections file');
  return;
}

// Compute the output file path
// In the same folder with the name tracker.json
var arrayTemp = pathRawDetectionsInput.split('/')
arrayTemp.pop()
var pathToTrackerOutput = `${arrayTemp.join('/')}/tracker.json`
console.log(`Tracker data will be written here: ${pathToTrackerOutput}`);

// Optional params to clean up input detections
var CLEAN_UP_DETECTIONS = true;
var LARGEST_DETECTION_ALLOWED = 1920 * 40 / 100;
var DETECT_LIST = ["car", "bicycle", "truck", "motorbike"];
var IGNORED_AREAS = []; // example: [{"x":634,"y":1022,"w":192,"h":60},{"x":1240,"y":355,"w":68,"h":68}

// Store detections input
var detections = {}

// Store tracker output
var tracker = {}

// Parse detections input
fs.readFile(`${pathRawDetectionsInput}`, function(err, f){
    var lines = f.toString().split('\n');
    lines.forEach(function(l) {
      try {
        var detection = JSON.parse(l);
        detections[detection.frame] = detection.detections;
      } catch (e) {
        console.log('Error parsing line');
        console.log(l);
      }
    });

    Object.keys(detections).forEach(function(frameNb) {

      let detectionsForThisFrame = detections[frameNb]

      if(CLEAN_UP_DETECTIONS) {
        // Remove unwanted areas
        detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isInsideSomeAreas(IGNORED_AREAS, detection));
        // Remove unwanted items
        detectionsForThisFrame = ignoreObjectsNotToDetect(detectionsForThisFrame, DETECT_LIST);
        // Remove objects too big
        detectionsForThisFrame = detections[frameNb].filter((detection) => !isDetectionTooLarge(detection, LARGEST_DETECTION_ALLOWED));
      }

      Tracker.updateTrackedItemsWithNewFrame(detectionsForThisFrame, parseInt(frameNb, 10))

      tracker[frameNb] = Tracker.getJSONOfTrackedItems();
    });

    fs.writeFile(`${pathToTrackerOutput}`, JSON.stringify(tracker), function() {
      console.log('Output tracker data wrote');
    });
});





