
var AtlasApp = (function (atlas) {

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
    min_zoom: d3.max([window.innerWidth / 6, window.innerHeight / 3]),
    max_zoom: d3.max([window.innerHeight, window.innerWidth]) * Options.scale,
    upper_drag_limit: null,
    lower_drag_limit: null,
    last_scale: null,
    last_trans: [0, 0],
    maxlat: 83,
    scale_extent: [window.innerWidth, 8 * window.innerHeight],
    select_tool: false,
    _time: 0,

    round1: function round1(x) {
      return Math.round(x * 10) / 10;
    },
    round2: function round2(x) {
      return Math.round(x * 100) / 100;
    },
    roundn: function roundn(x, n) {
      return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
    },
    API_URL: 'http://atlas.rdcep.org/api/',
    GRID_ENDPOINT: 'grid_data/',
    META_ENDPOINT: 'meta_data/'

  };

})(AtlasApp || {});

