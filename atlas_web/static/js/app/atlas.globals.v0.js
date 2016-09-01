
var AtlasUI = (function (ui) {

  'use strict';
  
  return {
    data_type: 'raster',
    data: [],
    grid_regions: null,
    bbox: {
      top_left: [0, 0], bottom_right: [0, 0],
      top_right: [0, 0], bottom_left: [0, 0]
    },
    height: window.innerHeight,
    width: window.innerWidth,
    _time: 0,
    upper_drag_limit: null,
    lower_drag_limit: null,
    last_scale: null,
    last_trans: [0, 0],
    maxlat: 83,
    scale_extent: [window.innerWidth, 8 * window.innerHeight],

    round1: function round1(x) {
      return Math.round(x * 10) / 10;
    },
    round2: function round2(x) {
      return Math.round(x * 100) / 100;
    },
    roundn: function roundn(x, n) {
      return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
    }
  };

})(AtlasUI || {});

