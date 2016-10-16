
var AtlasUI = (function (ui) {

  'use strict';

  function projection_bounds() {
    var yaw = ui.projection.rotate()[0]
      , max_lat = 83
      , xy_max = ui.projection([-yaw+180-1e-6, -max_lat])
      , xy_min = ui.projection([-yaw-180+1e-6,  max_lat]);
    return [xy_min, xy_max];
  }

  var last_x = 0
    , last_y = 0
    , last_k = 0
    , scale_extent = [.33, 2]
  ;

  var zooming = function zooming() {

    if (d3.event) {

      var x = d3.event.transform.x
        , y = d3.event.transform.y
        , scale = d3.event.transform.k
      ;

      // console.log(ui.projection.scale(), scale);
      console.log(ui.min_zoom, ui.max_zoom);

      if ((scale != last_k)
        && (ui.projection.scale() * scale > ui.min_zoom)
        && (ui.projection.scale() * scale < ui.max_zoom)
      ) {


        ui.projection.scale(ui.projection.scale() * scale);

      } else {

        var dx = x - last_x
          , dy = y - last_y
          , dk = d3.event.transform.k / last_k
          , yaw = ui.projection.rotate()[0]
          , pitch = ui.projection.center()[1]
          , tp = ui.projection.translate()
          , b = projection_bounds()
        ;

        ui.projection.rotate([
          yaw + 360. * dx / ui.width * scale_extent[0] / scale, 0, 0]);
        if (b[0][1] + dy > 0) {
          dy = -b[0][1];
        } else if (b[1][1] + dy < ui.height) {
          dy = ui.height - b[1][1];
        }
        ui.projection.translate([tp[0], tp[1] + dy]);
      }

      last_x = x;
      last_y = y;
      last_k = scale;

    }

    d3.selectAll('.geo').attr('d', ui.path);

  };

  var zoomend = function zoomend() {
    console.log(ui.bbox);
    ui.get_grid_data_by_bbox(Options.dataset);
  };

  d3.select('svg').call(d3.zoom()
    .scaleExtent(scale_extent)
    .on('zoom', zooming)
    .on('end', zoomend)
  );

  return ui;

})(AtlasUI || {});