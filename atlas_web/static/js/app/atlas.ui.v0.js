'use strict';

var color_options = {
  /*
   Object for storing application's color state.
   */
  schemes: {
    orange: {
      interp: d3.interpolateOranges,
      reverse: false },
    spectral: {
      interp: d3.interpolateSpectral,
      reverse: true}
  },
  colors: [],
  bins: 9
};

var color = d3.scaleLinear()
  .range([d3.rgb('white'), d3.rgb('black')]);
var color2 = d3.scaleQuantile()
  .range(color_options.colors);

var component_table = function component_table(arr) {
  /*
   Generate color tables for SVG component replacement as space-separated
   strings.
   */
  var j = 0;
  while (j < 100) {
    if (j / 100 < (arr[arr.length - 2] + arr[arr.length - 1]) / 2) {
      arr.splice(j, 0, arr[arr.length - 1])
    } else {
      arr.pop();
      arr.splice(j, 0, arr[arr.length - 1])
    }
    j += 1;
  }
  return arr.splice(0, 100).join(' ');
};

var create_color_scheme = function create_color_scheme(interp, color_bins) {
  /*
   Update UI color given scheme and number of bins.
   */
  color_options.colors = [];
  var r = []
    , g = []
    , b = []
    , c
  ;

  for (var i=0; i < color_bins; ++i) {
    c = d3.rgb(interp.interp(i / (color_bins - 1)));
    color_options.colors.push(c);
    r.push(Math.round(c.r / 255 * 100) / 100);
    g.push(Math.round(c.g / 255 * 100) / 100);
    b.push(Math.round(c.b / 255 * 100) / 100);
  }

  if (!interp.reverse) {
    r.reverse();
    g.reverse();
    b.reverse();
    color_options.colors.reverse();
  }

  ct2.select('feFuncR').attr('tableValues', r.join(' '));
  ct2.select('feFuncG').attr('tableValues', g.join(' '));
  ct2.select('feFuncB').attr('tableValues', b.join(' '));
  color2.range(color_options.colors);
  update_data_fills();
  draw_color_legend(15);

};

d3.selectAll('.color_scheme')
  .on('click', function() {
    Options.color_scheme = d3.select(this).attr('id');
    create_color_scheme(color_options.schemes[Options.color_scheme],
      color_options.bins);
  });

var get_viewport_dimensions = function get_viewport_dimensions() {
  /*
   Return coordinates of viewport bounding box
   */
  top_left = projection.invert([0, 0]);
  bottom_right = projection.invert([width, height]);

  top_left[0] = bottom_right[0] > 180 ? top_left[0] - 180 : top_left[0];
  bottom_right[0] = bottom_right[0] > 180 ? bottom_right[0] - 180 : bottom_right[0];

  top_right = [bottom_right[0], top_left[1]];
  bottom_left = [top_left[0], bottom_right[1]];

  return {
    'top_left': top_left,
    'top_right': top_right,
    'bottom_left': bottom_left,
    'bottom_right': bottom_right
  }
};

var new_resize_wrapper = function new_resize_wrapper() {
  /*
   Wrapper function for debouncing resize events.
   */
  clearTimeout(resize_event);
  resize_event = setTimeout(new_resize, 1000);
};

var new_resize = function new_resize() {
  /*
   Resize SVG when browser resizes.
   */
  width = window.innerWidth;
  height = window.innerHeight;
  svg_root.attrs({
    height: height,
    width: width,
    'viewBox': '0 0 ' + width + ' ' + height});
  projection.translate([width / 2, height / 2])
    .scale(get_map_scale());

  if (Options.datatype == 'raster') {
    get_grid_data_by_bbox(Options.dataset);
  } else if (Options.datatype == 'polygon') {
    get_agg_by_regions(Options.dataset, Options.regions);
  }
};

var show_loader = function show_loader() {
  /*
   Show animated SVG loader element.
   */
  var loader = d3.select('#loader');
  loader.style('display', 'block')
    .style('top', (height - loader.node().getBoundingClientRect().height) / 2 + 'px')
    .style('left', (width - loader.node().getBoundingClientRect().width) / 2 + 'px');
};

var hide_loader = function show_loader() {
  /*
   Hide animated SVG loader element.
   */
  var loader = d3.select('#loader');
  loader.style('display', 'none');
};

var draw_color_legend = function color_legend(block_size) {
  /*
   Draw color legend in bottom right corner of map.
   */
  var top_margin = 15
    , legend_height = color2.range().length * block_size + (color2.range().length-1) + 70
    , gap = 3;
  d3.selectAll('.legend_bkgd').remove();
  d3.selectAll('.legend_region').remove();
  d3.selectAll('.legend-block').remove();
  d3.selectAll('.legend-data').remove();

  legend_layer.append('rect')
    .attrs({
      height: legend_height,
      width: 160,
      x: width - 240,
      y: height - (legend_height + 81),
      class: 'legend_bkgd'})
    .styles({
      opacity: .9,
      fill: 'white'});

  legend_layer.append('text')
  //TODO: Replace with variable name, units
    .text('GADM 0')
    .attrs({
      x: width - 240 + 15,
      y: height - (legend_height + 58),
      class: 'legend_region'})
    .styles({
      fill: 'black',
      opacity: .65,
      'font-weight': 600});

  legend_layer.selectAll('.legend-block')
    .data(color2.range())
    .enter()
    .append('rect')
    .attrs({
      width: block_size,
      height: block_size,
      class: 'legend-block',
      x: width - 240 + 15 })
    .attr('fill', function (d) { return d; })
    .attr('y', function (d, i) {
      return height - (legend_height + 60) +
        top_margin + i * (block_size + gap); });

  legend_layer.selectAll('.legend-data')
    .data(color2.range())
    .enter()
    .append('text')
    .attrs({
      x: width - 240 + 35,
      class: 'legend-data'})
    .text(function (d, i) {
      var q = color2.quantiles(),
        r = color2.range().length
      ;
      if (i == 0) { return round2(color2.domain()[0]) + '–' + round2(q[i]); }
      if (i == r - 1) { return round2(q[i-1]) + '–' + round2(color2.domain()[1]); }
      return round2(q[i-1]) + '–' + round2(q[i]); })
    .attr('y', function (d, i) {
      return height - (legend_height + 60) + top_margin + (block_size - 3) +
        (color_options.bins - i - 1) * (block_size + gap); });
};

d3.select('#input_buckets')
  .on('input', function(){
    color_options.bins = d3.select("#input_buckets").node().value;
    create_color_scheme(color_options.schemes[Options.color_scheme],
      color_options.bins)
  });

d3.select('#legend_settings')
  .on('click', function() {
    var l = d3.select('#legend_layer');
    var eye = d3.select('#iconSwitch');
    if (l.style('visibility') == 'visible') {
        l.style('visibility', 'hidden');
        eye.attrs({class: 'fa fa-eye fa-lg'});
      } else {
        l.style('visibility', 'visible');
        eye.attrs({class: 'fa fa-eye-slash fa-lg'});
      }});
