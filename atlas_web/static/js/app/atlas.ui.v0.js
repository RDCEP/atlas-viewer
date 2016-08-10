/*

var color = d3.scaleQuantile()
    .range(['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
            '#f16913', '#d94801', '#a63603', '#7f2704']);

var oranges = ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
            '#f16913', '#d94801', '#a63603', '#7f2704'];

var diverging = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf',
            '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'];

*/

var all_the_color = {
    schemes:{
        'orange': d3.interpolateOranges,
        'spectral': d3.interpolateSpectral
    },
    colors: [d3.rgb(255,245,235), d3.rgb(254,230,206), d3.rgb(253,208,162), d3.rgb(253,174,107),
            d3.rgb(253,141,60), d3.rgb(241,105,19), d3.rgb(217,72,1), d3.rgb(166,54,3), d3.rgb(127,39,4)]
};

var color_bins = 9;

var color = d3.scaleQuantile()
    .range(all_the_color.colors);

var create_color_scheme = function create_color_scheme(interp, color_bins) {
  console.log(interp);
    all_the_color.colors = [];
    for (var i=0; i < color_bins; ++i){
        all_the_color.colors.push(interp(i/(color_bins-1)));
    }
    color.range(all_the_color.colors);
    update_data_fills();
    draw_color_legend(15);
};

d3.selectAll('.color_scheme')
    .on('click', function() {
      Options.color_scheme = d3.select(this).attr('id');
        create_color_scheme(all_the_color.schemes[Options.color_scheme], color_bins);
    });

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


metadata_layer.append('rect')
    .attrs({
    });

var draw_color_legend = function color_legend(block_size) {
  var top_margin = 15
    , bottom_margin = 70 - top_margin
    , legend_height = color.range().length * block_size + (color.range().length-1) + 70
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
        opacity: .8,
        fill: 'white'});

  legend_layer.append('text')
      .text('GADM 0')
      .attrs({
        x: width - 240 + 15,
        y: height - (legend_height + 58),
        class: 'legend_region'})
      .styles({
          fill: 'black',
          opacity: .65,
          'font-weight': 600});

  var legend_blocks = legend_layer.selectAll('.legend-block')
      .data(color.range())
      .enter()
      .append('rect')
      .attrs({
        width: block_size,
        height: block_size,
        class: 'legend-block',
        x: width - 240 + 15 })
      .attr('fill', function (d) { return d; })
      .attr('y', function (d, i) { return height - (legend_height + 60) + top_margin + i * (block_size + gap); });

  var legend_data = legend_layer.selectAll('.legend-data')
      .data(color.domain())
      .enter()
      .append('text')
      .attrs({
        width: color.domain().length,
        height: legend_height,
        x: width - 240 + 35,
        class: 'legend-data'})
      .styles({
        opacity: .75})
      .text(function(d) {return d;})
      .attr('y', function (d, i) { return height - (legend_height + 60) + top_margin + (block_size - 3) + (i * (color_bins - 1)) * (block_size + gap);});
};

d3.select('#input_buckets')
  .on('input', function(){
    // TODO: make options load color scheme on run
    color_bins = d3.select("#input_buckets").node().value;

    create_color_scheme(all_the_color['schemes'][Options.color_scheme],color_bins)
  });

d3.select('#legend_settings')
    .on('click', function() {
        var l = d3.select('#legend_layer');
        var eye = d3.select('#iconSwitch');
        if (l.style('visibility') == 'visible'){
            l.style('visibility', 'hidden');
            eye.attrs({class: 'fa fa-eye fa-lg'});
        } else {
            l.style('visibility', 'visible');
            eye.attrs({class: 'fa fa-eye-slash fa-lg'});
        }});

var choose_agregation_regions = function choose_agregation_regions() {
  var regions = d3.select('#aggregation_regions li a');
  regions.on('click', function() {
    d3.event.preventDefault();
  })
  
};