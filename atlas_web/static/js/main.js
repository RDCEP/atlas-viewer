
var AtlasUI = (function (ui) {

  'use strict';

  // bbox
  // upper_drag_limit
  // lower_drag_limit
  // draw_map_basics()
  // atlas(error, queued_data)

  var _get_domain_of_data = function _get_domain_of_data(data) {
    return [
      d3.min(data, function(d) {
        return d3.min(d.properties.value.values,
          function(dd) { return dd; }); }),
      d3.max(data, function(d) {
        return d3.max(d.properties.value.values,
          function(dd) {return dd; }); })
    ];
  };

  var _atlas = function _atlas(error, queued_data) {
    /*
     Draw the map to the viewport.

     */

    Options.datatype = queued_data['data_type'];

    var data = queued_data['data'];
    data = queued_data['data_type']
      ? ui.process_raster_geometry(data)
      : data;

    data.filter(function (d) { return d.properties.value !== null; });

    // Calculates the domain of the data by finding its min and max.
    // FIXME: Need to have a static domain based on the min and max of the
    // entire dataset. This is contained in the metadata. Otherwise we
    // might choose to let the user whether they want a static or
    // dynamic (domain changes upon panning) domain.
    var domain = _get_domain_of_data(data);
    ui.color.domain(domain);
    ui.color2.domain(domain);

    if (Options.datatype !== null) {
      ui.create_color_scheme(Options.color_scheme, Options.color_bins);
    }

    var grid_layer = d3.select('.grid.layer');
    grid_layer.selectAll('.grid.geo').remove();

    var grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data);
    grid_regions.enter().append('path')
      .attr('class', 'grid geo')
      .style('fill', function(d) {
        return d.properties.value.values[ui._time] == null
          ? 'transparent' : ui.color(d.properties.value.values[ui._time]);
      })
    ;

    d3.selectAll('.geo').attr('d', ui.path);

    ui.update_map_regions();
    ui.update_map_events();
    ui.hide_loader();

  };

  d3.select('#time_select').on('input', function() {
    ui._time = +d3.select(this).property('value');
    ui.update_data_fills();
  });

  d3.select('#smooth_select').on('input', function() {
    d3.select('feGaussianBlur').attr('stdDeviation',
      +d3.select(this).property('value'));
  });

  // TODO: Set ui.bbox in ui.js
  ui.bbox = ui.get_viewport_dimensions();

  // TODO: Set drag_limits in map.js
  ui.upper_drag_limit = ui.projection([0, 89])[1];
  ui.lower_drag_limit = ui.projection([0, -89])[1] - ui.height;

  ui.draw_map_basics();
  ui.get_data(Options.datatype);
  ui.toggle_zoom();

  ui.atlas = function(error, queued_data) {
    return _atlas(error, queued_data);
  };

  return ui;

})(AtlasUI || {});