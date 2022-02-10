#! /usr/bin/env node
var fs = require("fs");
var Tracker = require('./tracker');
var parseArgs = require('minimist')
// Utilities for cleaning up detections input
var isInsideSomeAreas = require('./utils').isInsideSomeAreas;
var ignoreObjectsNotToDetect = require('./utils').ignoreObjectsNotToDetect;
var isDetectionTooLarge = require('./utils').isDetectionTooLarge;

/*
    NOTE: this file is a big mess with piled up code from different use cases
    Should be reworked to be much simpler
    If you are looking for the tracker, look tracker.js file
    this main.js is just giving different way to operate tracker.js
*/

// Export Tracker API to use as a node module
exports.Tracker = Tracker

var debugOutput = false;

// Parse CLI args
var args = parseArgs(process.argv.slice(2));
// Path to raw detections input
var pathRawDetectionsInput = args.input;

if (args.debug) {
  console.log('debug mode');
  // Running in debug mode output full json
  debugOutput = true;
}

// If input path not specified abort
if (!pathRawDetectionsInput) {
  //console.error('Please specify the path to the raw detections file');
  return;
}

// Compute the output file path
// In the same folder with the name tracker.json
var arrayTemp = pathRawDetectionsInput.split('/')
arrayTemp.pop()
var pathToTrackerOutput = arrayTemp.length > 0 ? `${arrayTemp.join('/')}/tracker.json` : `tracker.json`;
var pathToMOTOutput = `${arrayTemp.join('/')}/outputTrackerMOT.txt`

// AlexeyAB darknet mode
var MODE_DARKNET = args.mode === "opendatacam-darknet";

// MOT Challenge mode
var MODE_MOTChallenge = args.mode === "motchallenge";

if (!MODE_MOTChallenge) {
  console.log(`Tracker data will be written here: ${pathToTrackerOutput}`);
} else {
  console.log(`Tracker data will be written here: ${pathToMOTOutput}`);
}

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

// Store MOT output
var MOToutput = []

// If MODE is BEATTHETRAFFIC keep all tracker history in memory
if (MODE_BEATTHETRAFFIC) {
  Tracker.enableKeepInMemory();
}

// Parse detections input
fs.readFile(`${pathRawDetectionsInput}`, function (err, f) {

  var lines = [];

  if (MODE_DARKNET) {
    // Parse all 
    try {
      var detectionsFromDarknet = JSON.parse(f);
      // Convert into a format the tracker can handle
      detectionsFromDarknet.map((detectionFromDarknet) => {
        detections[detectionFromDarknet.frame_id] = detectionFromDarknet.objects.map((objectFromDarknet) => {
          return {
            x: objectFromDarknet.relative_coordinates.center_x,
            y: objectFromDarknet.relative_coordinates.center_y,
            w: objectFromDarknet.relative_coordinates.width,
            h: objectFromDarknet.relative_coordinates.height,
            confidence: parseFloat(objectFromDarknet.confidence) * 100,
            name: objectFromDarknet.name
          }
        })
      })
    } catch (e) {
      console.log('Error while parsing JSON input file, make sure it is valid json')
      return;
    }
  }
  else {
    lines = f.toString().split('\n');
    if (!MODE_MOTChallenge) {

      lines.forEach(function (l) {
        try {
          var detection = JSON.parse(l);
          detections[detection.frame] = detection.detections;
        } catch (e) {
          console.log('Error parsing line');
          console.log(l);
        }
      });
    } else {
      // For MOT Challenge detections input
      // format:
      // <frame>, <id>, <bb_left>, <bb_top>, <bb_width>, <bb_height>, <conf>, <x>, <y>, <z>
      // example:
      // 1, -1, 794.27, 247.59, 71.245, 174.88, 0.99999964, -1, -1, -1
      // 1, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      // 2, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      // 2, -1, 1648.1, 119.61, 66.504, 163.24, 0.99999964, -1, -1, -1
      lines.forEach((line) => {
        var detectionOfThisFrameArray = line.split(",");
        var detectionFrameIndex = parseInt(detectionOfThisFrameArray[0], 10);
        if (!Number.isNaN(detectionFrameIndex)) {
          var w = parseFloat(detectionOfThisFrameArray[4]);
          var h = parseFloat(detectionOfThisFrameArray[5]);

          var detection = {
            x: parseFloat(detectionOfThisFrameArray[2]) + w / 2,
            y: parseFloat(detectionOfThisFrameArray[3]) + h / 2,
            w,
            h,
            confidence: parseFloat(detectionOfThisFrameArray[6]) * 100,
            name: ""
          }
          if (detection.confidence > 0) {
            // If it's the first object for this frame, init empty array
            if (!detections[detectionFrameIndex]) {
              detections[detectionFrameIndex] = []
            }
            detections[detectionFrameIndex].push(detection);
          }
        }
      });
    }


    //console.log(JSON.stringify(detections));

  }

  Object.keys(detections).forEach(function (frameNb) {

    let detectionsForThisFrame = detections[frameNb]

    if (MODE_BEATTHETRAFFIC) {
      // Remove unwanted areas
      detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isInsideSomeAreas(IGNORED_AREAS, detection));
      // Remove unwanted items
      detectionsForThisFrame = ignoreObjectsNotToDetect(detectionsForThisFrame, DETECT_LIST);
      // Remove objects too big
      detectionsForThisFrame = detectionsForThisFrame.filter((detection) => !isDetectionTooLarge(detection, LARGEST_DETECTION_ALLOWED));
    }

    Tracker.updateTrackedItemsWithNewFrame(detectionsForThisFrame, parseInt(frameNb, 10))

    if (!MODE_MOTChallenge) {
      if(MODE_DARKNET) {
        // Do not round coordinates of bbox
        tracker[frameNb] = Tracker.getJSONOfTrackedItems(false);
      } else {
        tracker[frameNb] = Tracker.getJSONOfTrackedItems();
      }
    } else {
      MOToutput = MOToutput.concat(Tracker.getTrackedItemsInMOTFormat(frameNb));
    }

  });

  var allTrackedItems = Tracker.getAllTrackedItems();

  if (MODE_BEATTHETRAFFIC) {

    // Overwrite name for each id with mostly matched name to avoid having
    // tracked item that change types
    // For each frame
    Object.keys(tracker).map((frameNb) => {
      tracker[frameNb] = tracker[frameNb].map((trackedItem) => {
        // Find 
        var item = allTrackedItems.get(trackedItem.id)
        var mostlyMatchedName = trackedItem.name;
        if (item) {
          mostlyMatchedName = item.getMostlyMatchedName()
        }

        if (BUS_AS_TRUCKS) {
          if (mostlyMatchedName === "bus") {
            // console.log('Change bus to truck');
            mostlyMatchedName = "truck"
          }
        }

        if (PERSON_AS_MOTORBIKE) {
          if (mostlyMatchedName === "person") {
            // console.log('Change person to motorbike');
            mostlyMatchedName = "motorbike"
          }
        }

        if (debugOutput) {
          // console.log(trackedItem);
          return {
            ...trackedItem,
            name: mostlyMatchedName
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
        if (TRACKED_LIST.indexOf(trackedItem.name) > -1) {
          return true
        } else {
          return false
        }
      });
    });
  } else {
    // Compute the lengths of all trajectories
    const count = MOToutput.reduce((acc, e) => {
      var id = e.split(',')[1];
      return acc.set(id, (acc.get(id) || 0) + 1);
    }, new Map());

    // MOT detections have a lot of false positives, so it's better to remove
    // short trajectories, which are likely due to false positives
    MOToutput = MOToutput.filter(line => count.get(line.split(',')[1]) >= 10);
  }

  if (!MODE_MOTChallenge) {
    fs.writeFile(`${pathToTrackerOutput}`, JSON.stringify(tracker), function () {
      console.log('Output tracker data wrote');
    });
  } else {
    fs.writeFile(`${pathToMOTOutput}`, MOToutput.join("\n"), function () {
      console.log('Output MOT data wrote');
    });
  }
});





