
var get_map_scale = function get_map_scale() {
  return d3.max([height, width]) * Options.scale;
};

var svgwrap = d3.select('#map')
  , svgroot = svgwrap.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '0 0 ' + width + ' ' + height)
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

var ct2;

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


filter
  .append('feGaussianBlur').attrs({stdDeviation: 0, result: 'gaussian_blur'});

ct2 = filter.append('feComponentTransfer').attr('in', 'gaussian_blur');
ct2.append('feFuncR').attrs({type: 'discrete'});
ct2.append('feFuncG').attrs({type: 'discrete'});
ct2.append('feFuncB').attrs({type: 'discrete'});

/*****************/
/* Map functions */
/*****************/

var draw_map_basics = function draw_map_basics() {
  /*
   Draw ocean, land background, region boundaries, graticule.
   */
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