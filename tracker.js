var ItemTracked = require('./ItemTracked').ItemTracked;
var kdTree = require('./lib/kdTree-min.js').kdTree;
var isEqual = require('lodash.isequal')
var iouAreas = require('./utils').iouAreas

var DEBUG_MODE = false;

// DEFAULT_UNMATCHEDFRAMES_TOLERANCE 
// This the number of frame we wait when an object isn't matched before considering it gone
var DEFAULT_UNMATCHEDFRAMES_TOLERANCE = 5;
// IOU_LIMIT, exclude things from beeing matched if their IOU is lower than this
// 1 means total overlap whereas 0 means no overlap
var IOU_LIMIT = 0.05

// A dictionary of itemTracked currently tracked
// key: uuid
// value: ItemTracked object
var mapOfItemsTracked = new Map();

// A dictionnary keeping memory of all tracked object (even after they disappear)
// Useful to ouput the file of all items tracked
var mapOfAllItemsTracked = new Map();

// By default, we do not keep all the history in memory
var keepAllHistoryInMemory = false;

// Implementation detail, we store the distance in a KDTREE, we want to be able to exclude values from 
// the kdtree search by assigning them KDTREESEARCH_LIMIT + 1
var KDTREESEARCH_LIMIT = 10000;


// Distance function
const computeDistance = function(item1, item2) {
  // IOU distance, between 0 and 1
  // The smaller the less overlap
  var iou = iouAreas(item1, item2);

  // Invert this as the KDTREESEARCH is looking for the smaller value
  var distance = 1 - iou;

  // If the overlap is iou < 0.95, exclude value
  if(distance > (1 - IOU_LIMIT)) {
    distance = KDTREESEARCH_LIMIT + 1;
  }

  return distance;
}

exports.computeDistance = computeDistance;

exports.updateTrackedItemsWithNewFrame = function(detectionsOfThisFrame, frameNb) {

  // A kd-tree containing all the itemtracked
  // Need to rebuild on each frame, because itemTracked positions have changed
  var treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), computeDistance, ["x", "y", "w", "h"]);

  // Contruct a kd tree for the detections of this frame
  var treeDetectionsOfThisFrame = new kdTree(detectionsOfThisFrame, computeDistance, ["x", "y", "w", "h"]);

  // SCENARIO 1: itemsTracked map is empty
  if(mapOfItemsTracked.size === 0) {
    // Just add every detected item as item Tracked
    detectionsOfThisFrame.forEach(function(itemDetected) {
      var newItemTracked = new ItemTracked(itemDetected, frameNb, DEFAULT_UNMATCHEDFRAMES_TOLERANCE)
      // Add it to the map
      mapOfItemsTracked.set(newItemTracked.id, newItemTracked)
      // Add it to the kd tree
      treeItemsTracked.insert(newItemTracked);
    });
  }
  // SCENARIO 2: We already have itemsTracked in the map
  else {
    var matchedList = new Array(detectionsOfThisFrame.length);
    matchedList.fill(false);
    // Match existing Tracked items with the items detected in the new frame
    // For each look in the new detection to find the closest match
    if(detectionsOfThisFrame.length > 0) {
      mapOfItemsTracked.forEach(function(itemTracked) {

        // First predict the new position of the itemTracked
        var predictedPosition = itemTracked.predictNextPosition()
        
        // Make available for matching
        itemTracked.makeAvailable();

        // Search for a detection that matches
        var treeSearchResult = treeDetectionsOfThisFrame.nearest(predictedPosition, 1, KDTREESEARCH_LIMIT)[0];
        
        // Only for debug assessments of predictions
        var treeSearchResultWithoutPrediction = treeDetectionsOfThisFrame.nearest(itemTracked, 1, KDTREESEARCH_LIMIT)[0];
        // Only if we enable the extra refinement
        var treeSearchMultipleResults = treeDetectionsOfThisFrame.nearest(predictedPosition, 2, KDTREESEARCH_LIMIT);

        // If we have found something
        if(treeSearchResult) {

          // This is an extra refinement that happens in 0.001% of tracked items matching
          // If IOU overlap is super similar for two potential match, add an extra check
          // if(treeSearchMultipleResults.length === 2) {

          //   var indexFirstChoice = 0;
          //   if(treeSearchMultipleResults[0][1] > treeSearchMultipleResults[1][1]) {
          //     indexFirstChoice = 1;
          //   }

          //   var detectionFirstChoice = {
          //     bbox: treeSearchMultipleResults[indexFirstChoice][0],
          //     distance: treeSearchMultipleResults[indexFirstChoice][1]
          //   }

          //   var detectionSecondChoice = {
          //     bbox: treeSearchMultipleResults[1 - indexFirstChoice][0],
          //     distance: treeSearchMultipleResults[1 - indexFirstChoice][1]
          //   }

          //   const deltaDistance = Math.abs(detectionFirstChoice.distance - detectionSecondChoice.distance);

          //   if(deltaDistance < 0.05) {

          //     detectionFirstChoice.area = detectionFirstChoice.bbox.w * detectionFirstChoice.bbox.h;
          //     detectionSecondChoice.area = detectionSecondChoice.bbox.w * detectionSecondChoice.bbox.h;
          //     var itemTrackedArea = itemTracked.w * itemTracked.h;

          //     var deltaAreaFirstChoice = Math.abs(detectionFirstChoice.area - itemTrackedArea) / (detectionFirstChoice.area + itemTrackedArea);
          //     var deltaAreaSecondChoice = Math.abs(detectionSecondChoice.area - itemTrackedArea) / (detectionSecondChoice.area + itemTrackedArea);

          //     // Compare the area of each, priorize the detections that as a overal similar area 
          //     // even if it overlaps less
          //     if(deltaAreaFirstChoice > deltaAreaSecondChoice) {
          //       if(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice) > 0.5) {
          //         if(DEBUG_MODE) {
          //           console.log('Switch choice ! wise it seems different for frame: ' + frameNb + ' itemTracked ' + itemTracked.idDisplay)
          //           console.log(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice));
          //         }
          //         // Change tree search result:
          //         treeSearchResult = treeSearchMultipleResults[1 - indexFirstChoice]
          //       }
          //     }
          //   }
          // }

          if(DEBUG_MODE) {
           // Assess different results between predition or not
            if(!isEqual(treeSearchResult[0], treeSearchResultWithoutPrediction && treeSearchResultWithoutPrediction[0])) {
              console.log('Making the pre-prediction led to a difference result:');
              console.log('For frame ' + frameNb + ' itemNb ' + itemTracked.idDisplay)
            }
          }

          var indexClosestNewDetectedItem = detectionsOfThisFrame.indexOf(treeSearchResult[0]);
          // If this detections was not already matched to a tracked item
          // (otherwise it would be matched to two tracked items...)
          if(!matchedList[indexClosestNewDetectedItem]) {
            matchedList[indexClosestNewDetectedItem] = {
              idDisplay: itemTracked.idDisplay
            }
            // Update properties of tracked object
            var updatedTrackedItemProperties = detectionsOfThisFrame[indexClosestNewDetectedItem]
            mapOfItemsTracked.get(itemTracked.id)
                            .makeUnavailable()
                            .update(updatedTrackedItemProperties, frameNb)
          } else {
            // Means two already tracked item are concurrent to get assigned a new detections
            // Rule is to priorize the oldest one to avoid id-reassignment
          }
        }
      });
    } else {
      console.log('Nothing detected for frame nº' + frameNb)
    }

    // Add any unmatched items as new trackedItem only if those new items are not too similar
    // to existing trackedItems this avoids adding some double match of YOLO and bring down drasticly reassignments
    if(mapOfItemsTracked.size > 0) { // Safety check to see if we still have object tracked (could have been deleted previously)
      // Rebuild tracked item tree to take in account the new positions
      treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), computeDistance, ["x", "y", "w", "h"]);
      // console.log(`Nb new items Unmatched : ${matchedList.filter((isMatched) => isMatched === false).length}`)
      matchedList.forEach(function(matched, index) {
        // Iterate through unmatched new detections
        if(!matched) {
          // Do not add as new tracked item if it is to similar to an existing one 
          var treeSearchResult = treeItemsTracked.nearest(detectionsOfThisFrame[index], 1, KDTREESEARCH_LIMIT)[0];

          if(!treeSearchResult) {
            var newItemTracked = ItemTracked(detectionsOfThisFrame[index], frameNb, DEFAULT_UNMATCHEDFRAMES_TOLERANCE)
            // Add it to the map
            mapOfItemsTracked.set(newItemTracked.id, newItemTracked)
            // Add it to the kd tree
            treeItemsTracked.insert(newItemTracked);
            // Make unvailable
            newItemTracked.makeUnavailable();
          } else {
            // console.log('Do not add, its overlapping an existing object')
          }
        }
      });
     }

    // Start killing the itemTracked (and predicting next position) 
    // that are tracked but haven't been matched this frame
    mapOfItemsTracked.forEach(function(itemTracked) {
      if(itemTracked.available) {
        itemTracked.countDown(frameNb);
        itemTracked.updateTheoricalPositionAndSize();
        if(itemTracked.isDead()) {
          mapOfItemsTracked.delete(itemTracked.id);
          treeItemsTracked.remove(itemTracked);
          if(keepAllHistoryInMemory) {
            mapOfAllItemsTracked.set(itemTracked.id, itemTracked);
          }
        }
      }
    });
    
  }
}

exports.reset = function() {
  mapOfItemsTracked = new Map();
  mapOfAllItemsTracked = new Map();
}

exports.enableKeepInMemory = function() {
  keepAllHistoryInMemory = true;
}

exports.disableKeepInMemory = function() {
  keepAllHistoryInMemory = false;
}

exports.getJSONOfTrackedItems = function() {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSON();
  });
};

exports.getJSONDebugOfTrackedItems = function() {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSONDebug();
  });
};

// Work only if keepInMemory is enabled
exports.getAllTrackedItems = function() {
  return mapOfAllItemsTracked;
};

// Work only if keepInMemory is enabled
exports.getJSONOfAllTrackedItems = function() {
  return Array.from(mapOfAllItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSONGenericInfo();
  });
};
