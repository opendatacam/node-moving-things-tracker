const Tracker = require('../tracker');

const detections = [
  [
    {
      x: 0.688212,
      y: 0.755398,
      w: 0.026031,
      h: 0.048941,
      confidence: 16.5444,
      name: 'object'
    }
  ],
  [], // This empty frame ensure that the object will be removed if fastDelete is enabled.
  [
    {
      x: 0.686925,
      y: 0.796403,
      w: 0.028142,
      h: 0.050919,
      confidence: 25.7651,
      name: 'object'
    }
  ],
  [
    {
      x: 0.686721,
      y: 0.837579,
      w: 0.027887,
      h: 0.054398,
      confidence: 34.285399999999996,
      name: 'object'
    }
  ],
  [
    {
      x: 0.686436,
      y: 0.877328,
      w: 0.026603,
      h: 0.058,
      confidence: 18.104300000000002,
      name: 'object'
    }
  ]
];

describe('Tracker', function () {
  beforeEach(function () {
    Tracker.reset();
    Tracker.setParams({
      fastDelete: true,
      unMatchedFramesTolerance: 5,
      iouLimit: 0.05
    });

    detections.forEach((frame, frameNb) => {
      Tracker.updateTrackedItemsWithNewFrame(frame, frameNb);
    });
  });

  describe('reset', function () {
    it('resets ItemTracker idDisplay', function () {
      Tracker.reset();

      Tracker.updateTrackedItemsWithNewFrame(detections[0], 0);

      expect(Tracker.getJSONOfTrackedItems()[0].id).toBe(0);
    });
  });

  describe('fast delete', function () {
    it('removes items with fast delete', function () {
      expect(Tracker.getJSONOfTrackedItems()[0].id).toBeGreaterThan(0);
    });

    it('keeps the item if fastDelete is disabled', function () {
      Tracker.setParams({ fastDelete: false });
      Tracker.reset();

      detections.forEach((frame, frameNb) => {
        Tracker.updateTrackedItemsWithNewFrame(frame, frameNb);
      });

      expect(Tracker.getJSONOfTrackedItems()[0].id).toBe(0);
    });
  });
});
