/**
 * Created by njmattes on 5/9/16.
 */

// Application state
var data_type = 'raster'
  , world
  , data = []
  , grid_regions
  , top_left, bottom_right, top_right, bottom_left
  , dims
  , height = window.innerHeight
  , width = window.innerWidth
  , current_year = 1979
  , sens = 1
  , _time = 0

  , resize_time
  , resize_timeout = false
  , resize_delta = 200
  , resize_reload = false

  , upper_drag_limit
  , lower_drag_limit
  , last_scale = null
  , last_trans = [0, 0]
  , maxlat = 83
  , scale_extent = [height, 8 * height]

  , total_pan = {x: 0, y: 0, d: 0}
;