const ItemTracked = require('../ItemTracked');

describe("ItemTracked", function () {
  const properties = {
    x: null,
    y: null,
    w: null,
    h: null,
    name: "dummy",
    confidence: null
  };

  describe("idDisplay", function () {
    const item1 = ItemTracked.ItemTracked(properties);
    const item2 = ItemTracked.ItemTracked(properties);

    it('starts at 0', function () {
      expect(item1.idDisplay).toBe(0);
    });

    it('icrements IDs', function () {
      expect(item1.idDisplay).toBeLessThan(item2.idDisplay);
    });

    it('resets IDs', function () {
      ItemTracked.reset();
      const item3 = ItemTracked.ItemTracked(properties);
      expect(item3.idDisplay).toBe(0);
    });
  });

  describe('itemHistory', () => {
    it('stops at max length', () => {
      const item1 = ItemTracked.ItemTracked(properties);
      for (var i = 0; i < ItemTracked.ITEM_HISTORY_MAX_LENGTH + 2; i++) {
        item1.update(properties, i);
        expect(item1.itemHistory.length).toBeLessThanOrEqual(ItemTracked.ITEM_HISTORY_MAX_LENGTH);
      }
    });

    it('does not store history', () => {
      const originalItemHistoryMaxLen = ItemTracked.ITEM_HISTORY_MAX_LENGTH;
      ItemTracked.ITEM_HISTORY_MAX_LENGTH = 0;
      const item1 = ItemTracked.ItemTracked(properties);

      for (var i = 0; i < ItemTracked.ITEM_HISTORY_MAX_LENGTH + 2; i++) {
        item1.update(properties, i);
        expect(item1.itemHistory.length).toBe(ItemTracked.ITEM_HISTORY_MAX_LENGTH);
      }

      ItemTracked.ITEM_HISTORY_MAX_LENGTH = originalItemHistoryMaxLen;
    });
  });
});
