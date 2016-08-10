
var get_map_scale = function get_map_scale() {

  return d3.max([height, width]) * Options.scale;

};

var svgroot = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)
  , filter = svgroot.append('defs')
    .append('filter')
    .attr('id', 'grid_filter')
    .attr('x', 0)
    .attr('y', 0)
  , svg = svgroot.append('g')
  , ocean_layer = svg.append('g')
    .attr('id', 'ocean_layer')
  , grid_layer = svg.append('g')
    .attr('id', 'grid_layer')
    .attr('filter', 'url(#grid_filter)')
  , boundary_layer = svg.append('g')
    .attr('id', 'boundary_layer')
  , legend_layer = svg.append('g')
    .attrs({id: 'legend_layer'})
  , metadata_layer = d3.select('#metadata_list');
  
var projection = d3.geoEquirectangular()
    .rotate([-Options.lon, 0])
    .center([0, Options.lat])
    .scale(get_map_scale())
    .translate([width / 2, height / 2])
    .precision(.1)
  , path = d3.geoPath()
    .projection(projection)
  , graticule = d3.geoGraticule()

  , hover_legend = d3.select('#hover_legend')

  , sphere = [
      ocean_layer.append('path')
        .datum({type: 'Sphere'})
        .attr('id', 'sphere')
        .attr('d', path)
        .attr('class', 'boundary'),
      ocean_layer.append('use')
        .attr('class', 'stroke')
        .attr('xlink:href', '#sphere')
    ]
  , region_boundaries
  , region_fills
;

ocean_layer.append('path')
  .datum(graticule)
  .attr('class', 'graticule boundary')
  .attr('d', path)
  .style('stroke', '#B4D5E5')
  .style('stroke-width', '1px')
  .style('fill', 'transparent');

/***************/
/* SVG filters */
/***************/


var fetvr = [0.84, 0.95, 0.99, 0.99, 1, 0.87, 0.67, 0.45, 0.27]
  , fetvg = [0.19, 0.43, 0.68, 0.87, 1, 0.95, 0.85, 0.68, 0.46]
  , fetvb = [0.15, 0.26, 0.38, 0.56, 0.75, 0.97, 0.91, 0.82, 0.71]
  , ct2
;

/*
var fetvr = [0.5, 0.65, 0.85, 0.95, 0.99, 0.99, 0.99, 0.99, 1]
  , fetvg = [0.15, 0.21, 0.28, 0.41, 0.55, 0.68, 0.82, 0.90, 0.96]
  , fetvb = [0.02, 0.01, 0.00, 0.07, 0.24, 0.42, 0.64, 0.81, 0.92]
  , ct2
;

var change_rgb_percentages = function(){
    var colorRGB = colors.d3.rgb;
    fetvr = [];
    fetvg = [];
    fetvb = [];
    for (colorRGB.r in colorRGB){
        fetvr.push(colorRGB.r/255)
    }
    for (colorRGB.g in colorRGB){
        fetvg.push(colorRGB.g/255)
    }
    for (colorRGB.b in colorRGB){
        fetvb.push(colorRGB.b/255)
    }
};


*/
filter
  .append('feGaussianBlur').attr({in: 'SourceGraphic', stdDeviation: 0 });

ct2 = filter.append('feComponentTransfer');
ct2.append('feFuncR').attr({type: 'discrete', tableValues: fetvr.join(' ')});
ct2.append('feFuncG').attr({type: 'discrete', tableValues: fetvg.join(' ')});
ct2.append('feFuncB').attr({type: 'discrete', tableValues: fetvb.join(' ')});

/*****************/
/* Map functions */
/*****************/

var draw_map_basics = function draw_map_basics() {

  dims = get_viewport_dimensions();

  d3.request('/api/map')
    .header("Content-Type", "application/json")
    .post(
      JSON.stringify({bbox: [dims['top_left'][0], dims['top_left'][1],
      dims['bottom_right'][0], dims['bottom_right'][1]],
      regions: Options.regions}),
      function(err, world) {

        world = JSON.parse(world.response);

        ocean_layer.selectAll('path.countries')
          .data(world)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', 'countries boundary')
          .style('stroke', 'none')
          .style('fill', '#dddddd');



        boundary_layer.selectAll('path.countries')
          .data(world)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', 'countries boundary')
          .style('stroke', '#666')
          .style('stroke-width', 1)
          .style('stroke-line-join', 'round')
          .style('fill', 'none');

      });
};

var draw_map_countries = function draw_map_countries() {

  //This is unused.

  d3.json('/static/json/ne_50m_admin_0_countries.geojson', function(world) {

    region_fills = ocean_layer.selectAll('path.countries')
      .data(world.features);
    region_fills.enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'countries boundary')
      .style('stroke', 'none')
      .style('fill', '#dddddd');

    region_fills.exit().remove();

    region_boundaries = boundary_layer.selectAll('path.countries')
      .data(world.features);
    region_boundaries.enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'countries boundary')
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('stroke-line-join', 'round')
      .style('fill', 'none');

    region_boundaries.exit().remove();
  });

};