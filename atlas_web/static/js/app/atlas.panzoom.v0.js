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

  if (Math.abs(total_pan.d) > 10) {
    grid_regions.remove();
  } else {
    total_pan.x += λ;
    total_pan.y += φ;
    total_pan.d = Math.sqrt(λ * λ + φ * φ);
  }


  φ = -φ > lower_drag_limit ? -lower_drag_limit
    : -φ < upper_drag_limit ? -upper_drag_limit
    : φ;

  var c = projection.invert([
    width / 2 - λ,
    height / 2 - φ]);

  projection
    .rotate([-c[0], 0])
    .center([0, c[1]]);
  svg.selectAll('.boundary').attr('d', path);
};

var drag_end = function drag_end() {
  if (total_pan.d > 10) {
    //TODO: last_data_request()
    get_grid_data_by_bbox(Options.dataset);
  }
};

var drag_rotate = d3.behavior.drag()
    .origin(function() {
      var r = projection.rotate();
      return {x: r[0] / sens, y: -r[1] / sens}; })
    .on('dragstart', drag_start)
    .on('drag', dragged)
    .on('dragend', drag_end)
  , scroll_zoom = d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height, 8 * height])
    .on('zoom', null)
;

