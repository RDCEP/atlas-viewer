
var get_map_scale = function get_map_scale() {

  return d3.max([height, width]) * 1.5;

};

var svgroot = d3.select('#map').append('svg')
    .attr({'width': width, 'height': height})
  , filter = svgroot.append('defs')
    .append('filter').attr({id: 'grid_filter', x: 0, y: 0})
  , svg = svgroot.append('g')
  , ocean_layer = svg.append('g')
    .attr('id', 'ocean_layer')
  , grid_layer = svg.append('g')
    .attr({id: 'grid_layer', filter: 'url(#grid_filter)'})
  , edges_layer = svg.append('g')
    .attr('id', 'edges_layer')
  
  , projection = d3.geo.equirectangular()
    .rotate([-Options.lon, 0])
    .center([0, Options.lat])
    .scale(get_map_scale())
    .translate([width / 2, height / 2])
    .precision(.1)
  , path = d3.geo.path()
    .projection(projection)
  , graticule = d3.geo.graticule()
  
  , hover_legend = d3.select('#hover_legend')
;

/***************/
/* SVG filters */
/***************/

var fetvr = [0.5, 0.65, 0.85, 0.95, 0.99, 0.99, 0.99, 0.99, 1, 1]
  , fetvg = [0.15, 0.21, 0.28, 0.41, 0.55, 0.68, 0.82, 0.90, 0.96]
  , fetvb = [0.02, 0.01, 0.00, 0.07, 0.24, 0.42, 0.64, 0.81, 0.92]
  , ct2
;

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
    // d3.json('/static/json/ne_50m_admin_0_countries.geojson', function(world) {
    d3.xhr('/api/map')
      .header("Content-Type", "application/json")
      .post(
        JSON.stringify({bbox: [dims['top_left'][0], dims['top_left'][1],
        dims['bottom_right'][0], dims['bottom_right'][1]],
          //TODO: get regions from global variable
        regions: 'ne_110m_admin_0_countries'}),
        function(err, world) {

          world = JSON.parse(world.response);

          var sphere = [
            ocean_layer.append('path')
              .datum({type: 'Sphere'})
              .attr('id', 'sphere')
              .attr('d', path)
              .attr('class', 'boundary'),
            ocean_layer.append('use')
              .attr('class', 'stroke')
              .attr('xlink:href', '#sphere')
          ];

          ocean_layer.append('path')
            .datum(graticule)
            .attr('class', 'graticule boundary')
            .attr('d', path)
            .style({
              stroke: '#B4D5E5',
              'stroke-width': '1px',
              fill: 'transparent'
            });

          ocean_layer.selectAll('path.countries')
            .data(world)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'countries boundary')
            .style({
              stroke: 'none',
              fill: '#dddddd'
            });

          edges_layer.selectAll('path.countries')
            .data(world)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'countries boundary')
            .style({
              stroke: '#666',
              'stroke-width': 1,
              'stroke-line-join': 'round',
              fill: 'none'
            });

        });

  };

var draw_map_countries = function draw_map_countries() {

    d3.json('/static/json/ne_50m_admin_0_countries.geojson', function(world) {

      ocean_layer.selectAll('path.countries')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'countries boundary')
        .style({
          stroke: 'none',
          fill: '#dddddd'
        });

      edges_layer.selectAll('path.countries')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'countries boundary')
        .style({
          stroke: 'black',
          'stroke-width': 1,
          'stroke-line-join': 'round',
          fill: 'none'
        });
    });
  };