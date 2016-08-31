'use strict';

function mercatorBounds(projection, maxlat) {
    var yaw = projection.rotate()[0],
        xymax = projection([-yaw+180-1e-6,-maxlat]),
        xymin = projection([-yaw-180+1e-6, maxlat]);

    return [xymin,xymax];
}

var zooming = function zooming() {

  if (d3.event) {
    var scale = d3.event.scale
      , t = d3.event.translate
      ;

    if (scale != last_scale) {

      projection.scale(scale);

    } else {

      var dx = t[0]-last_trans[0]
        , dy = t[1]-last_trans[1]
        , yaw = projection.rotate()[0]
        , tp = projection.translate()
        ;

        projection.rotate([yaw+360.*dx/width*scale_extent[0]/scale, 0, 0]);
        var b = mercatorBounds(projection, maxlat);
        if (b[0][1] + dy > 0) {
          dy = -b[0][1];
        } else if (b[1][1] + dy < height) {
          dy = height-b[1][1];
        }
        projection.translate([tp[0],tp[1]+dy]);
    }

    last_scale = scale;
    last_trans = t;

  }

  svg_root.selectAll('path').attr('d', path);

};

var zoomend = function zoomend() {

  draw_map_basics();

  if (Options.datatype == 'raster') {
    get_grid_data_by_bbox(Options.dataset);
  } else if (Options.datatype == 'polygon') {
    get_agg_by_regions(Options.dataset, Options.regions);
  }

  Options.scale = projection.scale() / d3.max([height, width]);
  var new_center = projection.invert([width/2, height/2]);
  Options.lon = new_center[0];
  Options.lat = new_center[1];

  upper_drag_limit = projection([0, 89])[1];
  lower_drag_limit = projection([0, -89])[1] - height;

};

// var t = d3.transition()
//     .duration(750)
//     .ease(d3.easeLinear);

// var zoom = d3.zoom()
//     .translateBy(t, function() { console.log(projection.translate()); return projection.translate(); }, projection.translate()[1])
//     .translateBy(t, projection.translate()[0], projection.translate()[1])
//     .scaleBy(t, projection.scale())
//     .scaleExtent(scale_extent)
//     .on('zoom', zooming)
//     .on('zoomend', zoomend)
// ;

