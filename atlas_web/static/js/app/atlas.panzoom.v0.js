/**
* Created by njmattes on 5/9/16.
*/

var drag_start = function drag_start() {
  total_pan.x = 0;
  total_pan.y = 0;
};

var dragged = function dragged() {

  var λ = d3.event.dx * sens
    , φ = d3.event.dy * sens
    , upper_drag_limit = projection([0, 90])[1]
    , lower_drag_limit = projection([0, -90])[1] - height
  ;

  console.log(upper_drag_limit, lower_drag_limit, φ);

  if (Math.abs(total_pan.d) > 10) {
    grid_regions.remove();
  }

  total_pan.x += λ;
  total_pan.y += φ;
  // total_pan.d = Math.sqrt(λ * λ + φ * φ);
  total_pan.d = Math.sqrt(Math.pow(total_pan.x, 2) + Math.pow(total_pan.y, 2));

  // φ = -φ > lower_drag_limit ? -lower_drag_limit
  //   : -φ < upper_drag_limit ? -upper_drag_limit
  //   : φ;

  total_pan.y = -total_pan.y > lower_drag_limit ? -lower_drag_limit
    : -total_pan.y < upper_drag_limit ? -upper_drag_limit
    : total_pan.y;

  var c = projection.invert([
    width / 2 - total_pan.x,
    height / 2 - total_pan.y]);

  projection
    .rotate([-c[0], 0])
    // .center([0, c[1]]);
    .center(c);
  svg.selectAll('.boundary').attr('d', path);
};

var drag_end = function drag_end() {

  if (Math.abs(total_pan.d) > 10) {
    //TODO: last_data_request()

    draw_map_basics();

    if (Options.datatype == 'raster') {
      get_grid_data_by_bbox(Options.dataset);
    } else if (Options.datatype == 'polygon') {
      get_agg_by_regions(Options.dataset, Options.regions);
    }

  }
};

var zoomed = function zoomed() {

  var t = d3.event.translate
    , s = d3.event.scale
    , upper_drag_limit = projection([0, 90])[1]
    , lower_drag_limit = projection([0, -90])[1] - height
    ;

  if (upper_drag_limit > 0) {
    t[1] -= upper_drag_limit;
  } else if (lower_drag_limit < 0) {
    t[1] += lower_drag_limit;
  }

  // t[1] = Math.min(height / 2 * (s - projection.scale()) + window.innerHeight / 2 * s,
  //   Math.max(height / 2 * (projection.scale() - s) - window.innerHeight / 2 * s, t[1]));



  zoom.translate(t);
  // zoom.scale(s);

  var c = projection.invert([
    width / 2 - total_pan.x,
    height / 2 - total_pan.y]);

  c0 = projection.center();
  c1 = projection.invert([
    c0[0] + (c0[0] + t[0]),
    c0[1]
  ]);

  console.log(c0, c1);

  // projection
  //   .rotate([-c1[0], 0])
  //   .center([0, c1[1]])
  //   .scale(s);

  // g.style("stroke-width", 1 / s)
  // svg.attr("transform", "translate(" + t + ")scale(" + s + ")");
  projection.translate(t).scale(s);
  svgroot.selectAll('path').attr('d', path);

  // projection.translate(d3.event.translate).scale(d3.event.scale);
  // svgroot.selectAll('path').attr('d', path);
};

var zoomend = function zoomend() {
  draw_map_basics();

  if (Options.datatype == 'raster') {
    get_grid_data_by_bbox(Options.dataset);
  } else if (Options.datatype == 'polygon') {
    get_agg_by_regions(Options.dataset, Options.regions);
  }

  // Options.scale = projection.scale();
  Options.scale = projection.scale() / d3.max([height, width]);
  var new_center = projection.invert([width/2, height/2]);
  Options.lon = new_center[0];
  Options.lat = new_center[1];

};

var drag_rotate = d3.behavior.drag()
    .origin(function() {
      var r = projection.rotate();
      return {x: r[0] / sens, y: -r[1] / sens}; })
    .on('dragstart', drag_start)
    .on('drag', dragged)
    .on('dragend', drag_end)
  , zoom = d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height, 8 * height])
    .on('zoom', zoomed)
    .on('zoomend', zoomend)
;

