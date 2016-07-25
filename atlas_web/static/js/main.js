
var group_data_test = false;

var atlas = function atlas(error, queued_data) {

  Options.datatype = queued_data['data_type'];

  data = queued_data['data'];
  data = Options.datatype == 'raster' ? process_raster_geometry(data) : data;
  data.filter(function (d) { return d.properties.value != null; });

  // color.domain([
  //   d3.min(data, function(d) {
  //     return d3.min(d.properties.value.values,
  //       function(dd) {return dd; }); }),
  //   d3.max(data, function(d) {
  //     return d3.max(d.properties.value.values, function(dd) {return dd; }); })]);
  color.domain([0, 1000]);

  grid_regions = grid_layer.selectAll('.grid-boundary')
    .data(data)
    .enter().append('path')
    .attr('class', 'grid-boundary boundary')
  ;

  grid_regions.exit().remove();
  update_data_fills();

  // svgroot.call(drag_rotate);
  // svgroot.call(zoom);

  svg.selectAll('.boundary').attr('d', path);
  hide_loader();

};

var time_opt = d3.select('#time_select');
var time_label = d3.select('#menu_time label');
time_opt.on('input', function() {
  _time = +d3.select(this).property('value');
  //var _ctime = time_label.text();
  current_year = 1979 + _time;
  //time_label.text(current_year);
  //d3.select('#corner_legend [data-type="time"]').text(current_year);
  update_data_fills(data);
});

var smooth_opt = d3.select('#smooth_select');
smooth_opt.on('input', function() {
  d3.select('feGaussianBlur').attr('stdDeviation',
    +d3.select(this).property('value'));
});

d3.select(window).on('resize', resize);

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