'use strict';

var data_type = 'raster'
  , data = []
  , grid_regions
  , top_left, bottom_right, top_right, bottom_left
  , dims
  , height = window.innerHeight
  , width = window.innerWidth
  , _time = 0

  , resize_event

  , upper_drag_limit
  , lower_drag_limit
  , last_scale = null
  , last_trans = [0, 0]
  , maxlat = 83
  , scale_extent = [height, 8 * height]

;

var round2 = function round2(x) {
  return Math.round(x * 100) / 100;
};

var round1 = function round1(x) {
  return Math.round(x * 10) / 10;
};

var roundn = function roundn(x, n) {
  return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
};