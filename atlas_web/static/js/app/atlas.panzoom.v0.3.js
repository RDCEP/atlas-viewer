
var AtlasApp = (function (atlas) {

  'use strict';

  /*
  _projection_bounds()
  _zooming()
    Called on zoom event of SVG
  _zoom_end()
    Called on zoomend event of SVG
  toggle_zoom()
    Toggle between pixel selection and pan/zoom cursors
   */

  function _projection_bounds() {
    var yaw = atlas.projection.rotate()[0]
      , max_lat = 83
      , xy_max = atlas.projection([-yaw + 180 - 1e-6, -max_lat])
      , xy_min = atlas.projection([-yaw - 180 + 1e-6,  max_lat]);
    return [xy_min, xy_max];
  }

  var last_x = 0
    , last_y = 0
    , last_k = 0
    , scale_extent = [.33, 2]
  ;

  var _zooming = function _zooming() {

    if (d3.event) {

      var x = d3.event.transform.x
        , y = d3.event.transform.y
        , scale = d3.event.transform.k
      ;

      if ((scale !== last_k)
        && (atlas.projection.scale() * scale > atlas.min_zoom)
        && (atlas.projection.scale() * scale < atlas.max_zoom)
      ) {

        atlas.projection.scale(atlas.projection.scale() * scale);

      } else {

        var dx = x - last_x
          , dy = y - last_y
          , dk = d3.event.transform.k / last_k
          , yaw = atlas.projection.rotate()[0]
          , pitch = atlas.projection.center()[1]
          , tp = atlas.projection.translate()
          , b = _projection_bounds()
        ;

        atlas.projection.rotate([
          yaw + 360. * dx / atlas.width * scale_extent[0] / scale, 0, 0]);
        if (b[0][1] + dy > 0) {
          dy = -b[0][1];
        } else if (b[1][1] + dy < atlas.height) {
          dy = atlas.height - b[1][1];
        }
        atlas.projection.translate([tp[0], tp[1] + dy]);
      }

      last_x = x;
      last_y = y;
      last_k = scale;

    }

    d3.selectAll('.geo').attr('d', atlas.path);

  };

  var _zoomend = function _zoomend() {
    atlas.bbox = atlas.get_viewport_dimensions();
    atlas.get_data(Options.datatype);
  };

  var _toggle_zoom = function _toggle_zoom() {
    if (atlas.select_tool) {
      d3.select('svg')
        .on('.zoom', null)
        .classed('select_tool', true);
    } else {
      d3.select('svg').call(d3.zoom()
        .scaleExtent(scale_extent)
        .on('zoom', _zooming)
        .on('end', _zoomend))
        .classed('select_tool', false);
    }
    atlas.update_map_events();
  };

  atlas.toggle_zoom = function() {
    _toggle_zoom();
  };

  return atlas;

})(AtlasApp || {});