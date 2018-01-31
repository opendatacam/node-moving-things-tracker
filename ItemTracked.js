var uuidv4 = require('uuid/v4');

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

var computeVelocityVector = function(item1, item2, nbFrame) {
  return {
    dx: (item2.x - item1.x) / nbFrame,
    dy: (item2.y - item1.y) / nbFrame,
  }
}

var computeGrowFactor = function(item1, item2, nbFrame) {
  return {
    dw: (item2.w - item1.w) / nbFrame,
    dh: (item2.h - item1.h) / nbFrame,
  }
}

var computeAccelerationVector = function(velocity1, velocity2, nbFrame) {
  return {
    dvx: (velocity2.dx - velocity1.dx) / nbFrame,
    dvy: (velocity2.dy - velocity1.dy) / nbFrame
  }
}

/*

  computeBearingIn360

                       dY

                       ^               XX
                       |             XXX
                       |            XX
                       |           XX
                       |         XX
                       |       XXX
                       |      XX
                       |     XX
                       |    XX    bearing = this angle in degree
                       |  XX
                       |XX
+----------------------XX----------------------->  dX
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       |
                       +

*/

var computeBearingIn360 = function(dx, dy) {
  var a = Math.atan(dy / dx)
  a = a * 180 / Math.PI
  if(dx < 0) {
    a = a + 180
  } else if (dy < 0) {
    a = a + 360 
  }
  return a;
}

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
  itemTracked.growFactor = {
    dw: 0,
    dh: 0
  }
  itemTracked.nbTimeMatched = 1;
  // TODO: add itemTracked.yoloIndex
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
    // reset dying counter
    this.frameUnmatchedLeftBeforeDying = DEFAULT_UNMATCHEDFRAMES_TOLERANCE
    // Compute new velocityVector based on last positions history
    this.velocity = this.updateVelocityVector();
    this.growFactor = this.updateGrowFactor();
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
    // console.log(this.acceleration);
    this.x = this.x + this.velocity.dx
    this.y = this.y + this.velocity.dy
    this.w = this.w + this.growFactor.dw
    this.h = this.h + this.growFactor.dh
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
  // average based on the last X frames
  // TODO Improve, it's not the average currently
  // It's the diff between 15 frames
  itemTracked.updateVelocityVector = function() {
    var AVERAGE_NBFRAME = 15;
    if(this.itemHistory.length <= AVERAGE_NBFRAME) {
      return computeVelocityVector(this.itemHistory[0], this.itemHistory[this.itemHistory.length - 1], this.itemHistory.length);
    } else {
      return computeVelocityVector(this.itemHistory[this.itemHistory.length - AVERAGE_NBFRAME], this.itemHistory[this.itemHistory.length - 1], AVERAGE_NBFRAME);
    }
  }

  itemTracked.updateGrowFactor = function() {
    var AVERAGE_NBFRAME = 15;
    if(this.itemHistory.length <= AVERAGE_NBFRAME) {
      return computeGrowFactor(this.itemHistory[0], this.itemHistory[this.itemHistory.length - 1], this.itemHistory.length);
    } else {
      return computeGrowFactor(this.itemHistory[this.itemHistory.length - AVERAGE_NBFRAME], this.itemHistory[this.itemHistory.length - 1], AVERAGE_NBFRAME);
    }
  }

  itemTracked.updateAccelerationVector = function() {
    var AVERAGE_NBFRAME = 15;
    if(this.velocityHistory.length <= AVERAGE_NBFRAME) {
      return computeAccelerationVector(this.velocityHistory[0], this.velocityHistory[this.velocityHistory.length - 1], this.velocityHistory.length);
    } else {
      return computeAccelerationVector(this.velocityHistory[this.velocityHistory.length - AVERAGE_NBFRAME], this.velocityHistory[this.velocityHistory.length - 1], AVERAGE_NBFRAME);
    }
  }

  itemTracked.toJSON = function() {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      // Here we negate dy to be in "normal" carthesian coordinates
      bearing: computeBearingIn360(this.velocity.dx, - this.velocity.dy),
      name: this.name,
      isZombie: this.isZombie,
      zombieOpacity: 1,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame
    }
  }
  itemTracked.toJSONGenericInfo = function() {
    return {
      id: this.id,
      idDisplay: this.idDisplay,
      appearFrame: this.appearFrame,
      disappearFrame: this.disappearFrame,
      disappearArea: this.disappearArea,
      nbActiveFrame: this.disappearFrame - this.appearFrame
    }
  }
  return itemTracked;
};

