
var AtlasUI = (function (ui) {

  'use strict';

  var _atlas = function _atlas(error, queued_data) {

    Options.datatype = queued_data['data_type'];

    var data = queued_data['data'];
    data = Options.datatype == 'raster'
      ? ui.process_raster_geometry(data)
      : data;
    data.filter(function (d) { return d.properties.value != null; });


    var domain = [
      d3.min(data, function(d) {
        return d3.min(d.properties.value.values, function(dd) { return dd; }); }),
      d3.max(data, function(d) {
        return d3.max(d.properties.value.values, function(dd) {return dd; }); })];
    ui.color.domain(domain);
    ui.color2.domain(domain);

    if (Options.datatype != null) {
      ui.create_color_scheme(Options.color_scheme, Options.color_bins);
    }

    var grid_layer = d3.select('#grid_layer');
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

  if (Options.datatype == null) {
    ui.get_agg_by_regions('default_firr_yield_whe', 'ne_110m_admin_0_countries');
  } else if (Options.datatype == 'raster') {
    ui.get_grid_data_by_bbox(Options.dataset);
  } else if (Options.datatype == 'polygon') {
    ui.get_agg_by_regions(Options.dataset, Options.regions);
  }

  ui.draw_map_basics();

  ui.upper_drag_limit = ui.projection([0, 89])[1];
  ui.lower_drag_limit = ui.projection([0, -89])[1] - ui.height;

  ui.atlas = function(error, queued_data) {
    return _atlas(error, queued_data);
  };

  return ui;

})(AtlasUI || {});