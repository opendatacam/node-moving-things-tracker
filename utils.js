exports.isDetectionTooLarge = (detections, largestAllowed) => {
  if(detections.w >= largestAllowed) {
    return true;
  } else {
    return false;
  }
}

const isInsideArea = (area, point) => {
  const xMin = area.x - area.w / 2;
  const xMax = area.x + area.w / 2;
  const yMin = area.y - area.h / 2;
  const yMax = area.y + area.h / 2;

  if(point.x >= xMin &&
     point.x <= xMax &&
     point.y >= yMin &&
     point.y <= yMax) {
    return true;
  } else {
    return false;
  }
}

exports.isInsideArea = isInsideArea;

exports.isInsideSomeAreas = (areas, point) => {
  const isInside = areas.some((area) => isInsideArea(area, point));
  return isInside;
}

exports.ignoreObjectsNotToDetect = (detections, objectsToDetect) => {
  return detections.filter((detection) => objectsToDetect.indexOf(detection.name) > -1)
}

const getRectangleEdges = (item) => {
  return {
    x0: item.x - item.w / 2,
    y0: item.y - item.h / 2,
    x1: item.x + item.w / 2,
    y1: item.y + item.h / 2,
  }
}

exports.getRectangleEdges = getRectangleEdges;

exports.iouAreas = (item1, item2) => {

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


exports.computeVelocityVector = (item1, item2, nbFrame) => {
  return {
    dx: (item2.x - item1.x) / nbFrame,
    dy: (item2.y - item1.y) / nbFrame,
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

exports.computeBearingIn360 = function(dx,dy) {
  var angle = Math.atan(dx/dy)/(Math.PI/180)
  if ( angle > 0 ) {
    if (dy > 0)
      return angle;
    else
      return 180 + angle;
  } else {
    if (dx > 0)
      return 180 + angle;
    else
      return 360 + angle;
  }
}
