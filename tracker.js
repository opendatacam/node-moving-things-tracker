var ItemTracked = require('./ItemTracked').ItemTracked;
var kdTree = require('./lib/kdTree-min.js').kdTree;
var isEqual = require('lodash.isequal')


// A dictionary of itemTracked currently
// key: uuid
// value: ItemTracked object
var mapOfItemsTracked = new Map();

// A dictionnary keeping memory of all tracked object (even after they disappear)
var mapOfAllItemsTracked = new Map();

// This should be big
var KTREESEARCH_LIMIT = 10000;
// DISTANCE_LIMIT is the limit tolerated of distance between
// the center of the bbox across frames to be considered the same objects
var DISTANCE_LIMIT = 100;
// Limit the grow of the bbox between two frame to be considered the same object
var SIZE_VARIATION_LIMIT = 100;
// DEFAULT_UNMATCHEDFRAMES_TOLERANCE 
// is the number of frame we wait when an object isn't matched before 
// considering it gone
// TODO configure when instantiating tracker.. IDEA: Instantiate tracker with FPS estimated
// in order to have the best config
var DEFAULT_UNMATCHEDFRAMES_TOLERANCE = 5;

// Simple euclidian distance function between two points
var computeEuclidianDistance = function(item1, item2) {
  return Math.sqrt( Math.pow((item1.x - item2.x), 2) + Math.pow((item1.y- item2.y), 2));
}

var getRectangleEdges = function(item) {
  return {
    x0: item.x,
    y0: item.y,
    x1: item.x + item.w,
    y1: item.y + item.h
  }
}

var iouAreas = function(item1, item2) {

  var rect1 = getRectangleEdges(item1);
  var rect2 = getRectangleEdges(item2);
  
  // Get overlap rectangle
  var overlap_x0 = Math.max(rect1.x0, rect2.x0)
  var overlap_y0 = Math.max(rect1.y0, rect2.y0)
  var overlap_x1 = Math.min(rect1.x1, rect2.x1)
  var overlap_y1 = Math.min(rect1.y1, rect2.y1)

  // if there an overlap
  if((overlap_x1 - overlap_x0) <= 0 || (overlap_y1 - overlap_y0) <= 0) {
    // no overlap
    return 0
  } else {
    area_rect1 = item1.w * item1.h
    area_rect2 = item2.w * item2.h
    area_intersection = (overlap_x1 - overlap_x0) * (overlap_y1 - overlap_y0)
    area_union = area_rect1 + area_rect2 - area_intersection
    return area_intersection / area_union
  }

}

// Distance function that takes in account bbox size + position
var computeDistance = function(item1, item2) {
  //** 1. COMPUTE EUCLIDIAN DISTANCE BETWEEN CENTERS */
  var euclidianDistance = computeEuclidianDistance(item1, item2)
  // Exclude this item1 to match the other is the distance between
  // the two center has grown too much
  // TODO MAKE DISTANCE_LIMIT DYNAMIC WITH VELOCITY AND BBOX SIZE
  if (euclidianDistance > DISTANCE_LIMIT) {
    // this is a way to exclude the item from beeing matched
    euclidianDistance = KTREESEARCH_LIMIT + 1;
  }
  //** 2. COMPUTE SIZE VARITION OF BBOX */
  var widthVariation = Math.abs(item1.w - item2.w);
  var heightVariation = Math.abs(item1.h - item2.h);
  var sizeVariation = (widthVariation + heightVariation);
  // Exclude this item1 to match the other is the distance between
  // the two center has grown too much
  // TODO MAKE SIZE_VARIATION_LIMIT DYNAMIC WITH BBOX SIZE
  if (sizeVariation > SIZE_VARIATION_LIMIT) {
    // this is a way to exclude the item from beeing matched
    sizeVariation = KTREESEARCH_LIMIT + 1;
  }

  // return euclidianDistance + sizeVariation;

  /* IOU distance */
  // The smaller the less overlap
  var iou = iouAreas(item1, item2);

  // Invert this as the KTREESEARCH is looking for the smaller value
  var distance = 1 - iou;

  // If the overlap is iou < 0.90, exclude
  if(distance > 0.95) {
    distance = KTREESEARCH_LIMIT + 1;
  }

  return distance;


  // console.log(`euclidianDistance ${euclidianDistance}`);
  // console.log(`sizeVariation ${sizeVariation}`);
  // console.log(`distance ${euclidianDistance + sizeVariation}`)
  // console.log(distance);
  return euclidianDistance + sizeVariation;
}

exports.reset = function() {
  mapOfItemsTracked = new Map();
  mapOfAllItemsTracked = new Map();
}

exports.updateTrackedItemsWithNewFrame = function(detectionsOfThisFrame, frameNb) {

  // A kd-tree containing all the itemtracked
  // Need to rebuild on each frame, because itemTracked positions have changed
  // don't know how to update the existing kdTree items instead of rebuilding it
  // we could remove / insert updated ones as well if we want to improve perfw
  var treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), computeDistance, ["x", "y", "w", "h"]);

  // Contruct a kd tree for the detections of this frame
  // For now don't add the index in yolo array
  var treeDetectionsOfThisFrame = new kdTree(detectionsOfThisFrame, computeDistance, ["x", "y", "w", "h"]);

  // SCENARIO 1: itemsTracked map is empty
  if(mapOfItemsTracked.size === 0) {
    // console.log('SCENARIO 1: itemsTracked map is empty')
    // Just add every detected item as item Tracked
    detectionsOfThisFrame.forEach(function(itemDetected) {
      var newItemTracked = ItemTracked(itemDetected, frameNb, DEFAULT_UNMATCHEDFRAMES_TOLERANCE)
      // Add it to the map
      mapOfItemsTracked.set(newItemTracked.id, newItemTracked)
      // Add it to the kd tree
      treeItemsTracked.insert(newItemTracked);
    });
  }
  // SCENARIO 2: We have fewer itemTracked than item detected by YOLO in the new frame
  else {
    var matchedList = new Array(detectionsOfThisFrame.length);
    matchedList.fill(false);
    // Match existing Tracked items with the items detected in the new frame
    // For each look in the new detection to find the closest match
    if(detectionsOfThisFrame.length > 0) {
      mapOfItemsTracked.forEach(function(itemTracked) {

        // TODO 1:  IDEA Maybe first predict ? And then try to match
        var predictedPosition = itemTracked.predictNextPosition()
        
        itemTracked.makeAvailable();

        var treeSearchResult = treeDetectionsOfThisFrame.nearest(predictedPosition, 1, KTREESEARCH_LIMIT)[0];
        var treeSearchResultWithoutPrediction = treeDetectionsOfThisFrame.nearest(itemTracked, 1, KTREESEARCH_LIMIT)[0];
        var treeSearchMultipleResults = treeDetectionsOfThisFrame.nearest(predictedPosition, 2, KTREESEARCH_LIMIT);

        // If we have found something
        if(treeSearchResult) {

          // If 2 results see if distance are similar, maybe the shortest one 
          // is not the best one
          if(treeSearchMultipleResults.length === 2) {

            var indexFirstChoice = 0;
            if(treeSearchMultipleResults[0][1] > treeSearchMultipleResults[1][1]) {
              indexFirstChoice = 1;
            }

            var detectionFirstChoice = {
              bbox: treeSearchMultipleResults[indexFirstChoice][0],
              distance: treeSearchMultipleResults[indexFirstChoice][1]
            }

            var detectionSecondChoice = {
              bbox: treeSearchMultipleResults[1 - indexFirstChoice][0],
              distance: treeSearchMultipleResults[1 - indexFirstChoice][1]
            }

            const deltaDistance = Math.abs(detectionFirstChoice.distance - detectionSecondChoice.distance);

            if(deltaDistance < 0.05) {

              detectionFirstChoice.area = detectionFirstChoice.bbox.w * detectionFirstChoice.bbox.h;
              detectionSecondChoice.area = detectionSecondChoice.bbox.w * detectionSecondChoice.bbox.h;
              var itemTrackedArea = itemTracked.w * itemTracked.h;

              var deltaAreaFirstChoice = Math.abs(detectionFirstChoice.area - itemTrackedArea) / (detectionFirstChoice.area + itemTrackedArea);
              var deltaAreaSecondChoice = Math.abs(detectionSecondChoice.area - itemTrackedArea) / (detectionSecondChoice.area + itemTrackedArea);

              if(deltaAreaFirstChoice > deltaAreaSecondChoice) {
                if(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice) > 0.5) {
                  console.log('Switch choice ! wise it seems different for frame: ' + frameNb + ' itemTracked ' + itemTracked.idDisplay)
                  // console.log(frameNb);
                  console.log(Math.abs(deltaAreaFirstChoice - deltaAreaSecondChoice));

                  // Change tree search result:
                  treeSearchResult = treeSearchMultipleResults[1 - indexFirstChoice]
                }
              }

              // Compare the area of each, priorize the detections that as a overal similar area even 
              // if it overlaps less


            }
          }

           // Assess different results between predition or not
          if(!isEqual(treeSearchResult[0], treeSearchResultWithoutPrediction && treeSearchResultWithoutPrediction[0])) {
            // console.log('Making the predirection led to a difference result:');
            // console.log('For frame ' + frameNb + ' itemNb ' + itemTracked.idDisplay)
          }

          var indexClosestNewDetectedItem = detectionsOfThisFrame.indexOf(treeSearchResult[0]);
          // If this detections was not already matched to a tracked item
          // (otherwise it would be matched to two tracked items...)
          if(!matchedList[indexClosestNewDetectedItem]) {
            matchedList[indexClosestNewDetectedItem] = {
              idDisplay: itemTracked.idDisplay,
              distance: computeDistance(treeSearchResult[0], itemTracked)
            }
            // Update properties of tracked object
            var updatedTrackedItemProperties = detectionsOfThisFrame[indexClosestNewDetectedItem]
            mapOfItemsTracked.get(itemTracked.id)
                            .makeUnavailable()
                            .update(updatedTrackedItemProperties, frameNb)
          } else {
            // Means two already tracked item are concurrent to get assigned a new detections
            // Rule is to priorize the oldest one to avoid id-reassignment

            // And do not assign the de-priorize matched item, let him become a zombie otherwise it will
            // be tried to get

            // TODO VERIFY IF THIS REALLY CAUSE FLICKERING 
            // TODO This tracked item won't have the first detection choice, but we can give him the second or third choice if it exists
            // better than becoming a zombie ?
            // if(treeSearchResult.length > 1) {
            //   indexClosestNewDetectedItem = detectionsOfThisFrame.indexOf(treeSearchResult[1][0]);
            //   if(!matchedList[indexClosestNewDetectedItem]) {
            //     console.log('Give the second choice to tracked item')
            //     matchedList[indexClosestNewDetectedItem] = {
            //       idDisplay: itemTracked.idDisplay,
            //       distance: computeDistance(treeSearchResult[1][0], itemTracked)
            //     }
            //     // Update properties of tracked object
            //     var updatedTrackedItemProperties = detectionsOfThisFrame[indexClosestNewDetectedItem]
            //     mapOfItemsTracked.get(itemTracked.id)
            //                     .makeUnavailable()
            //                     .update(updatedTrackedItemProperties, frameNb)
            //   } else {
            //     if(treeSearchResult > 2) {
            //       console.log('TODO Give third choice ?')
            //     }
            //   }
            // }
            // END FLICKERING
            

            // OTHER
            // This detections was already matched with a trackedItem
            // As the map forEach is "historical", the trackedItem that we already matched to this detection
            // is an "older" one, and we are looking give the best matches to the earliest tracked items to avoid
            // id-reassignment of those. We could consider to change this if the match if worth an ID reassignment
            // const olderTrackedItemMatchedForThisDetectionId = matchedList[indexClosestNewDetectedItem].idDisplay;
            // const olderTrackedItemmatchedForThisDetectionDistance = matchedList[indexClosestNewDetectedItem].distance;
            // console.log(`This detections was already matched for ${olderTrackedItemMatchedForThisDetectionId}`);
            // console.log(`Do we cancel and use it for ${itemTracked.idDisplay} ?`)
            // console.log(`Do it only if the match for ${itemTracked.idDisplay} is much better than the match for ${olderTrackedItemMatchedForThisDetectionId}`)
            // const distanceOfThisNewMatch = computeDistance(treeSearchResult[0], itemTracked);
            // console.log(`Distance between ${itemTracked.idDisplay} and new detection: ${distanceOfThisNewMatch}`)
            // console.log(`Distance between ${olderTrackedItemMatchedForThisDetectionId} and new detection: ${olderTrackedItemmatchedForThisDetectionDistance}`)
            // if(olderTrackedItemmatchedForThisDetectionDistance - distanceOfThisNewMatch > 0.5) {
            //   console.log("=======> It seems to be much better and worth an ID reassignment  ========<")
            //   console.log("=======> It seems to be much better and worth an ID reassignment  ========<")
            //   console.log("=======> It seems to be much better and worth an ID reassignment  ========<")
            //   // TODO
            // }
          }
        }
      });
    } else {
      console.log('nothing detected this frame ' + frameNb)
    }

    // Add any unmatched items as new trackedItem only if those new items are not too similar
    // to existing trackedItems this avoids adding some double match of YOLO and bring down 
    // drasticly reassignments
    if(mapOfItemsTracked.size > 0) { // Safety check to see if we still have object tracked (could have been deleted previously)
      // Rebuild tracked item tree to take in account the new positions
      treeItemsTracked = new kdTree(Array.from(mapOfItemsTracked.values()), computeDistance, ["x", "y", "w", "h"]);
      // console.log(`Nb new items Unmatched : ${matchedList.filter((isMatched) => isMatched === false).length}`)
      matchedList.forEach(function(matched, index) {
        // Iterate through unmatched new detections
        if(!matched) {
          // Do not add as new tracked item if it is to similar to an existing one 
          var treeSearchResult = treeItemsTracked.nearest(detectionsOfThisFrame[index], 1, KTREESEARCH_LIMIT)[0];

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
          mapOfAllItemsTracked.set(itemTracked.id, itemTracked);
        }
      }
    });
    
  }
  // SCENARIO 3 : We have more itemTracked than item detected by YOLO in the new frame
  // else {
  //   // console.log('SCENARIO 3 : We have more itemTracked than item detected by YOLO in the new frame')
  //   // All itemTracked should start as beeing available for matching
  //   mapOfItemsTracked.forEach(function(itemTracked) {
  //     itemTracked.makeAvailable();
  //   });

  //   var matchedItemsDistanceBuffer = {}

  //   // For every new detection of this frame, try to find a match in the existing
  //   // tracked items
  //   detectionsOfThisFrame.forEach(function(newItemDetected, indexNewItemDetected) {

  //     var treeSearchResult = treeItemsTracked.nearest(newItemDetected, 1, KTREESEARCH_LIMIT)[0];

  //     // If we have found something
  //     if(treeSearchResult) {
  //       var itemTrackedMatched = mapOfItemsTracked.get(treeSearchResult[0].id);

  //       if(itemTrackedMatched.available) {
  //         // If not matched yet this frame, just update it an make unavailable
  //         itemTrackedMatched.makeUnavailable();
  //         // Store the distance if this item is matched again this frame
  //         matchedItemsDistanceBuffer[itemTrackedMatched.id] = computeDistance(itemTrackedMatched, newItemDetected)
  //         // Update properties
  //         itemTrackedMatched.update(newItemDetected, frameNb);
  //       } else {
  //         // Already matched with a new detections for this frame
  //         // But maybe this new detections matches better, let's check
  //         const distanceOfThisMatch = computeDistance(treeSearchResult[0], newItemDetected);
  //         const distanceOfPreviousMatch =  matchedItemsDistanceBuffer[itemTrackedMatched.id];
  //         // The smaller distance the better
  //         if(distanceOfThisMatch < distanceOfPreviousMatch) {
  //           // Register this match which is better
  //           matchedItemsDistanceBuffer[itemTrackedMatched.id] = distanceOfThisMatch;
  //           // Update properties
  //           itemTrackedMatched.update(newItemDetected, frameNb);
  //         }
  //       }
  //     }

  //   });

  //   // Count unmatched frame for unmatched itemTracked
  //   // and delete stalled itemTracked
  //   mapOfItemsTracked.forEach(function(itemTracked) {
  //     if(itemTracked.available) {
  //       itemTracked.countDown(frameNb);
  //       itemTracked.updateTheoricalPositionAndSize();
  //       if(itemTracked.isDead()) {
  //         mapOfItemsTracked.delete(itemTracked.id);
  //         treeItemsTracked.remove(itemTracked);
  //         mapOfAllItemsTracked.set(itemTracked.id, itemTracked);
  //       }
  //     }
  //   });
  // }
}

exports.getJSONOfTrackedItems = function() {
  return Array.from(mapOfItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSON();
  });
};

exports.getJSONOfAllTrackedItems = function() {
  return Array.from(mapOfAllItemsTracked.values()).map(function(itemTracked) {
    return itemTracked.toJSONGenericInfo();
  });
};


