
var color = d3.scaleQuantile()
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
      get_dataset_for_viewport();
    }
    upper_drag_limit = projection([0, 89])[1];
    lower_drag_limit = projection([0, -89])[1] - height;
  }
};

var show_loader = function show_loader() {
  var loader = d3.select('#loader');
  loader.style('display', 'block')
    .style('top', (height - loader.node().getBoundingClientRect().height) / 2 + 'px')
    .style('left', (width - loader.node().getBoundingClientRect().width) / 2 + 'px');
};

var hide_loader = function show_loader() {
  var loader = d3.select('#loader');
  loader.style('display', 'none');
};

var show_chart_options = function show_chart_options() {
  var chart_options = d3.select('#chart_options');
  chart_options.style('display', 'block')
    .style('top', (height - loader.node().getBoundingClientRect().height) / 2 + 'px')
    .style('left', (width - loader.node().getBoundingClientRect().width) / 2 + 'px');
};

var color_legend = function color_legend() {

};

var choose_agregation_regions = function choose_agregation_regions() {
  
  var regions = d3.select('#aggregation_regions li a');
  regions.on('click', function() {
    d3.event.preventDefault();
    
  })
  
};