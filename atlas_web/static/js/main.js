
var group_data_test = false;

var atlas = function atlas(error, queued_data) {

  data = queued_data['data'];

  data_type = queued_data['data_type'];

  data.filter(function (d) { return d.properties.value != null; });

  color.domain([
    d3.min(data, function(d) {
      return d3.min(d.properties.value.values, function(dd) {return dd; }); }),
    d3.max(data, function(d) {
      return d3.max(d.properties.value.values, function(dd) {return dd; }); })]);

  if (Options.datatype != null) { draw_color_legend(15); }
  
  if (data_type == 'grid' && !group_data_test) {
    data.forEach(function (d) {

      var x = d.properties.centroid.geometry.coordinates[0];
      var y = d.properties.centroid.geometry.coordinates[1];

      // TODO: Need dynamic resolution
      var s = 0.25 + .005;

      d.geometry = {
        type: 'Polygon',
        coordinates: [[[x - s, y + s], [x + s, y + s], [x + s, y - s],
          [x - s, y - s], [x - s, y + s]]]
      }
    });
    grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data);
  } else if (data_type == 'agg' && !group_data_test) {
    grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data);
  } else {
    grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(draw_areas_by_time(data));
  }

  grid_regions.enter()
    .append('path')
    .attr('class', 'grid-boundary boundary')
    .attr('d', path)
    // .on('mouseover', grid_hover)
    // .on('mouseout', function() {
    //   hover_legend.style({display: 'none'});
    //   hover_legend.classed('hovered', false);})
  ;

  grid_regions.exit().remove();

  update_data_fills(data);
  // svgroot.call(drag_rotate);
  svgroot.call(zoom);

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