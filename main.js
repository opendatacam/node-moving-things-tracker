#! /usr/bin/env node
var fs  = require("fs");
var Tracker = require('./tracker');
var parseArgs = require('minimist')
// Utilities for cleaning up detections input
var isInsideSomeAreas = require('./utils').isInsideSomeAreas;
var ignoreObjectsNotToDetect = require('./utils').ignoreObjectsNotToDetect;
var isDetectionTooLarge = require('./utils').isDetectionTooLarge;

// Export Tracker API to use as a node module
exports.Tracker = Tracker

var debugOutput = false;

// Parse CLI args
var args = parseArgs(process.argv.slice(2));
// Path to raw detections input
var pathRawDetectionsInput = args.input;

if(args.debug) {
  console.log('debug mode');
  // Running in debug mode output full json
  debugOutput = true;
}

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

// Specific mode for beat the traffic game
var MODE_BEATTHETRAFFIC = args.mode === "beatthetraffic";
var BUS_AS_TRUCKS = args.busastruck;
var PERSON_AS_MOTORBIKE = args.personasmotorbike;

var LARGEST_DETECTION_ALLOWED = 1920 * 25 / 100;
var DETECT_LIST = ["bicycle", "car", "motorbike", "bus", "truck", "person"];
var TRACKED_LIST = ["car", "motorbike", "truck"]
var IGNORED_AREAS = []; // example: [{"x":634,"y":1022,"w":192,"h":60},{"x":1240,"y":355,"w":68,"h":68}

// Store detections input
var detections = {}

// Store tracker output
var tracker = {}

// If MODE is BEATTHETRAFFIC keep all tracker history in memory
if(MODE_BEATTHETRAFFIC) {
  Tracker.enableKeepInMemory();
}

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

      if(MODE_BEATTHETRAFFIC) {
        // Remove unwanted areas
        detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isInsideSomeAreas(IGNORED_AREAS, detection));
        // Remove unwanted items
        detectionsForThisFrame = ignoreObjectsNotToDetect(detectionsForThisFrame, DETECT_LIST);
        // Remove objects too big
        detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isDetectionTooLarge(detection, LARGEST_DETECTION_ALLOWED));
      }

      Tracker.updateTrackedItemsWithNewFrame(detectionsForThisFrame, parseInt(frameNb, 10))

      tracker[frameNb] = Tracker.getJSONOfTrackedItems();
      
    });

    var allTrackedItems = Tracker.getAllTrackedItems();

    if(MODE_BEATTHETRAFFIC) {

      // Overwrite name for each id with mostly matched name to avoid having
      // tracked item that change types
      // For each frame
      Object.keys(tracker).map((frameNb) => {
        tracker[frameNb] = tracker[frameNb].map((trackedItem) => {
          // Find 
          var item = allTrackedItems.get(trackedItem.id)
          var mostlyMatchedName = trackedItem.name;
          if(item) {
            mostlyMatchedName = item.getMostlyMatchedName()
          }

          if(BUS_AS_TRUCKS) {
            if(mostlyMatchedName === "bus") {
              // console.log('Change bus to truck');
              mostlyMatchedName = "truck"
            }
          }

          if(PERSON_AS_MOTORBIKE) {
            if(mostlyMatchedName === "person") {
              // console.log('Change person to motorbike');
              mostlyMatchedName = "motorbike"
            }
          }

          if(debugOutput) {
            // console.log(trackedItem);
            return {
              ...trackedItem,
              name : mostlyMatchedName
            }
          } else {
            // If not debug, excude some fields  
            // Ugly, would need an getJSON() as a utility function to avoid quote duplication      
            return {
              id: trackedItem.idDisplay,
              x: trackedItem.x,
              y: trackedItem.y,
              w: trackedItem.w,
              h: trackedItem.h,
              name: mostlyMatchedName,
              bearing: trackedItem.bearing
            }
          }
        })
      })

      // Remove the tracked item with the name that we won't render as clickable
      Object.keys(tracker).map((frameNb) => {
        tracker[frameNb] = tracker[frameNb].filter((trackedItem) => {
          if(TRACKED_LIST.indexOf(trackedItem.name) > -1) {
            return true
          } else {
            return false
          }
        });
      });
    }

    fs.writeFile(`${pathToTrackerOutput}`, JSON.stringify(tracker), function() {
      console.log('Output tracker data wrote');
    });
});





