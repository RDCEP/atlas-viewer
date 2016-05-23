/**
 * Created by njmattes on 5/9/16.
 */

// Application state
var data_type = 'grid'
  , world, data, grid_regions
  , top_left, bottom_right, top_right, bottom_left, dims
  , height = window.innerHeight
  , width = window.innerWidth
  , current_year = 1979
  , sens = 1
  , _time = 0

  , resize_time
  , resize_timeout = false
  , resize_delta = 200
  , resize_reload = false

  , total_pan = {x: 0, y: 0, d: 0}
;