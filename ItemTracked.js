var uuidv4 = require('uuid/v4');
var computeBearingIn360 = require('./utils').computeBearingIn360
var computeVelocityVector = require('./utils').computeVelocityVector

// Properties example
// {
//   "x": 1021,
//   "y": 65,
//   "w": 34,
//   "h": 27,
//   "prob": 26,
//   "name": "car"
// }

// Use a simple incremental unique id for the display
var idDisplay = 0;

exports.ItemTracked = function(properties, frameNb, DEFAULT_UNMATCHEDFRAMES_TOLERANCE){
  var DEFAULT_UNMATCHEDFRAMES_TOLERANCE = DEFAULT_UNMATCHEDFRAMES_TOLERANCE;
  var itemTracked = {};
  // ==== Private =====
  // Am I available to be matched?
  itemTracked.available = true;
  // Should I be deleted?
  itemTracked.delete = false;
  // How many unmatched frame should I survive?
  itemTracked.frameUnmatchedLeftBeforeDying = DEFAULT_UNMATCHEDFRAMES_TOLERANCE;
  itemTracked.isZombie = false;
  itemTracked.appearFrame = frameNb;
  itemTracked.disappearFrame = null;
  itemTracked.disappearArea = {};
  // Keep track of the most counted class
  itemTracked.nameCount = {};
  itemTracked.nameCount[properties.name] = 1;
  // ==== Public =====
  itemTracked.x = properties.x;
  itemTracked.y = properties.y;
  itemTracked.w = properties.w;
  itemTracked.h = properties.h;
  itemTracked.name = properties.name;
  itemTracked.itemHistory = [];
  itemTracked.itemHistory.push({
    x: properties.x,
    y: properties.y,
    w: properties.w,
    h: properties.h
  });
  itemTracked.velocity = {
    dx: 0,
    dy: 0
  };
  itemTracked.nbTimeMatched = 1;
  // Assign an unique id to each Item tracked
  itemTracked.id = uuidv4();
  // Use an simple id for the display and debugging
  itemTracked.idDisplay = idDisplay;
  idDisplay++
  // Give me a new location / size
  itemTracked.update = function(properties, frameNb){
    // if it was zombie and disappear frame was set, reset it to null
    if(this.disappearFrame) {
      this.disappearFrame = null;
      this.disappearArea = {}
    }
    this.isZombie = false;
    this.nbTimeMatched += 1;
    this.x = properties.x;
    this.y = properties.y;
    this.w = properties.w;
    this.h = properties.h;
    this.itemHistory.push({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h
    });
    this.name = properties.name;
    if(this.nameCount[properties.name]) {
      this.nameCount[properties.name]++;
    } else {
      this.nameCount[properties.name] = 1;
    }
    // Reset dying counter
    this.frameUnmatchedLeftBeforeDying = DEFAULT_UNMATCHEDFRAMES_TOLERANCE
    // Compute new velocityVector based on last positions history
    this.velocity = this.updateVelocityVector();
  }
  itemTracked.makeAvailable = function() {
    this.available = true;
    return this;
  }
  itemTracked.makeUnavailable = function() {
    this.available = false;
    return this;
  }
  itemTracked.countDown = function(frameNb) {
    // Set frame disappear number 
    if(this.disappearFrame === null) {
      this.disappearFrame = frameNb;
      this.disappearArea = {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h
      }
    }
    this.frameUnmatchedLeftBeforeDying--;
    this.isZombie = true;
    // If it was matched less than 1 time, it should die quick
    if(this.nbTimeMatched <= 1) {
      this.frameUnmatchedLeftBeforeDying = -1;
    }
  }
  itemTracked.updateTheoricalPositionAndSize = function() {
    this.itemHistory.push({
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h
    });
    this.x = this.x + this.velocity.dx
    this.y = this.y + this.velocity.dy
  }

  itemTracked.predictNextPosition = function() {
    return {
      x : this.x + this.velocity.dx,
      y : this.y + this.velocity.dy,
      w: this.w,
      h: this.h
    };
  }

  itemTracked.isDead = function() {
    return this.frameUnmatchedLeftBeforeDying < 0;
  }
  // Velocity vector based on the last 15 frames
  itemTracked.updateVelocityVector = function() {
    var AVERAGE_NBFRAME = 15;
    if(this.itemHistory.length <= AVERAGE_NBFRAME) {
      return computeVelocityVector(this.itemHistory[0], this.itemHistory[this.itemHistory.length - 1], this.itemHistory.length);
    } else {
      return computeVelocityVector(this.itemHistory[this.itemHistory.length - AVERAGE_NBFRAME], this.itemHistory[this.itemHistory.length - 1], AVERAGE_NBFRAME);
    }
  }

  itemTracked.getMostlyMatchedName = function() {
    var nameMostlyMatchedOccurences = 0;
    var nameMostlyMatched = '';
    Object.keys(this.nameCount).map((name) => {
      if(this.nameCount[name] > nameMostlyMatchedOccurences) {
        nameMostlyMatched = name;
        nameMostlyMatchedOccurences = this.nameCount[name]
      }
    })
    return nameMostlyMatched;
  }

  itemTracked.toJSONDebug = function() {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      x: parseInt(this.x, 10),
      y: parseInt(this.y, 10),
      w: parseInt(this.w, 10),
      h: parseInt(this.h, 10),
      // Here we negate dy to be in "normal" carthesian coordinates
      bearing: parseInt(computeBearingIn360(this.velocity.dx, - this.velocity.dy)),
      name: this.getMostlyMatchedName(),
      isZombie: this.isZombie,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame
    }
  }

  itemTracked.toJSON = function() {
    return {
      id: this.idDisplay,
      x: parseInt(this.x, 10),
      y: parseInt(this.y, 10),
      w: parseInt(this.w, 10),
      h: parseInt(this.h, 10),
      // Here we negate dy to be in "normal" carthesian coordinates
      bearing: parseInt(computeBearingIn360(this.velocity.dx, - this.velocity.dy), 10),
      name: this.getMostlyMatchedName()
    }
  }

  itemTracked.toJSONGenericInfo = function() {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame,
      disappearArea: this.disappearArea,
      nbActiveFrame: this.disappearFrame - this.appearFrame,
      name: this.getMostlyMatchedName()
    }
  }
  return itemTracked;
};

