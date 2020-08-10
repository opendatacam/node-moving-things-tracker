const ItemTracked = require('../ItemTracked');

describe("ItemTracked", function () {
  describe("idDisplay", function () {
    const properties = {
        x: null,
        y: null,
        w: null,
        h: null,
        name: "dummy",
        confidence: null
    };
    const item1 = ItemTracked.ItemTracked(properties);
    const item2 = ItemTracked.ItemTracked(properties);

    it('starts at 0', function() {
        expect(item1.idDisplay).toBe(0);
    });

    it('icrements IDs', function() {
      expect(item1.idDisplay).toBeLessThan(item2.idDisplay);
    });

    it('resets IDs', function() {
        ItemTracked.reset();
        const item3 = ItemTracked.ItemTracked(properties);
        expect(item3.idDisplay).toBe(0);
    });
  });
});
