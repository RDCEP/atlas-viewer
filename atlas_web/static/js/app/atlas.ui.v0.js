/*
var color = d3.scaleOrdinal(d3.schemeAccent);
*/

var color = d3.scale.quantile()
    .range(['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
            '#f16913', '#d94801', '#a63603', '#7f2704'])
  ;

var get_viewport_dimensions = function get_viewport_dimensions() {

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

var resize = function resize() {

  //Check for end of resize event
  resize_time = new Date();
  if (resize_timeout === false) {
    resize_timeout = true;
    setTimeout(resize_end, resize_delta);
  }

  //Resize SVG
  width = window.innerWidth;
  height = window.innerHeight;
  d3.select('svg').attr({height: height, width: width});

  //Set reload switch
  resize_reload = get_map_scale() < projection.scale();

  //Re-project
  projection.translate([width / 2, height / 2])
    .scale(get_map_scale());

  if (Options.datatype == 'raster') {
    get_grid_data_by_bbox(Options.dataset);
  } else if (Options.datatype == 'polygon') {
    get_agg_by_regions(Options.dataset, Options.regions);
  }
  d3.selectAll('.boundary').attr('d', path);
};

var resize_end = function resize_end() {
  //TODO: change scale_extent
  if (new Date() - resize_time < resize_delta) {
    setTimeout(resize_end, resize_delta);
  } else {
    resize_timeout = false;
    if (resize_reload) {
      //TODO: last_data_request()
      get_data_for_viewport();
    }
    upper_drag_limit = projection([0, 89])[1];
    lower_drag_limit = projection([0, -89])[1] - height;
  }
};

var show_loader = function show_loader() {
  var loader = d3.select('#loader');
  loader.style({
    display: 'block',
    top: (height - loader.node().getBoundingClientRect().height) / 2 + 'px',
    left: (width - loader.node().getBoundingClientRect().width) / 2 + 'px'
  });
};

var hide_loader = function show_loader() {
  var loader = d3.select('#loader');
  loader.style({ display: 'none' });
};

var show_chart_options = function show_chart_options() {
  var chart_options = d3.select('#chart_options');
  chart_options.style({
    display: 'block',
    top: (height - loader.node().getBoundingClientRect().height) / 2 + 'px',
    left: (width - loader.node().getBoundingClientRect().width) / 2 + 'px'
  });
};

var draw_color_legend = function color_legend(block_size) {
  var h = color.range().length * block_size + (color.range().length-1) + 70;
  d3.selectAll('.legend_bkgd').remove();
  d3.selectAll('.legend_region').remove();
  d3.selectAll('.legend-block').remove();
  d3.selectAll('.legend-data').remove();

  legend_layer.append('rect')
      .attr({
        height: h,
        width: 160,
        x: width - 240,
        y: height - (h + 81),
        class: 'legend_bkgd'})
      .style({
        opacity: .8,
        fill: 'white'});

  legend_layer.append('text')
      .text('GADM 0')
      .attr({
        x: width - 240 + 15,
        y: height - (h + 58),
        class: 'legend_region'})
      .style({
          fill: 'black',
          opacity: .65,
          'font-weight': 600});

  var legend_blocks = legend_layer.selectAll('.legend-block')
      .data(color.range())
      .enter()
      .append('rect')
      .attr({
        width: block_size,
        height: block_size,
        class: 'legend-block',
        x: width - 240 + 15 })
      .attr('fill', function (d) { return d; })
      .attr('y', function (d, i) { return height - (h + 60) + 17 * (i + 1) + i; });

  var legend_data = legend_layer.selectAll('.legend-data')
      .data(color.domain())
      .enter()
      .append('text')
      .attr({
        width: color.domain().length,
        height: h,
        x: width - 240 + 35,
        class: 'legend-data'})
      .style({
        opacity: .75})
      .text(function(d) {return d;})
      .attr('y', function (d, i) { return height - (h + 467) + 145 * (i + 3)  ; });
};

d3.select('#legend_settings')
    .on('click', function() {
        var l = d3.select('#legend_layer');
        if (l.style('visibility') == 'visible'){
            l.style('visibility', 'hidden');
        } else {
            l.style('visibility', 'visible')
        }});

var choose_agregation_regions = function choose_agregation_regions() {
  var regions = d3.select('#aggregation_regions li a');
  regions.on('click', function() {
    d3.event.preventDefault();
  })
  
};