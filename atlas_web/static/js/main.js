'use strict';

var atlas = function atlas(error, queued_data) {

  Options.datatype = queued_data['data_type'];

  var data = queued_data['data'];
  data = Options.datatype == 'raster' ? process_raster_geometry(data) : data;
  data.filter(function (d) { return d.properties.value != null; });

  var domain = [
    d3.min(data, function(d) {
      return d3.min(d.properties.value.values, function(dd) {return dd; }); }),
    d3.max(data, function(d) {
      return d3.max(d.properties.value.values, function(dd) {return dd; }); })];
  color.domain(domain);
  color2.domain(domain);

  if (Options.datatype != null) {
    create_color_scheme(
      color_options.schemes[Options.color_scheme], color_options.bins);
    draw_color_legend(15);
  }

  grid_layer.selectAll('.grid-boundary').remove();
  grid_regions = grid_layer.selectAll('.grid-boundary')
    .data(data);

  grid_regions.enter().append('path')
    .attr('class', 'grid-boundary boundary')
    .style('fill', function(d) {
      return d.properties.value.values[_time] == null
        ? 'transparent' : color(d.properties.value.values[_time]);
    })
  ;

  svg.selectAll('.boundary').attr('d', path);
  hide_loader();

};

var time_opt = d3.select('#time_select');
time_opt.on('input', function() {
  _time = +d3.select(this).property('value');
  update_data_fills();
});

var smooth_opt = d3.select('#smooth_select');
smooth_opt.on('input', function() {
  d3.select('feGaussianBlur').attr('stdDeviation',
    +d3.select(this).property('value'));
});

d3.select(window).on('resize', new_resize_wrapper);

if (Options.datatype == null) {
  get_agg_by_regions('default_firr_yield_whe', 'ne_110m_admin_0_countries');
} else if (Options.datatype == 'raster') {
  get_grid_data_by_bbox(Options.dataset);
} else if (Options.datatype == 'polygon') {
  get_agg_by_regions(Options.dataset, Options.regions);
}

draw_map_basics();

upper_drag_limit = projection([0, 89])[1];
lower_drag_limit = projection([0, -89])[1] - height;
