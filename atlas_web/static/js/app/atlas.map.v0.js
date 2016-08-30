'use strict';

var get_map_scale = function get_map_scale() {
  return d3.max([height, width]) * Options.scale;
};

var svg_wrap = d3.select('#map')
  , svg_root = svg_wrap.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '0 0 ' + width + ' ' + height)
  , filter = svg_root.append('defs')
    .append('filter')
    .attr('id', 'grid_filter')
    .attr('x', 0)
    .attr('y', 0)
  , svg = svg_root.append('g')
  , ocean_layer = svg.append('g')
    .attr('id', 'ocean_layer')
  , grid_layer = svg.append('g')
    .attr('id', 'grid_layer')
    .attr('filter', 'url(#grid_filter)')
  , boundary_layer = svg.append('g')
    .attr('id', 'boundary_layer')
  , legend_layer = svg.append('g')
    .attrs({id: 'legend_layer'})
;

var projection = d3.geoEquirectangular()
    .rotate([-Options.lon, 0])
    .center([0, Options.lat])
    .scale(get_map_scale())
    .translate([width / 2, height / 2])
    .precision(.1)
  , path = d3.geoPath()
    .projection(projection)
  , graticule = d3.geoGraticule()
  , ct2
;

filter.append('feGaussianBlur')
  .attrs({stdDeviation: 0, result: 'gaussian_blur'});
ct2 = filter.append('feComponentTransfer').attr('in', 'gaussian_blur');
ct2.append('feFuncR').attrs({type: 'discrete'});
ct2.append('feFuncG').attrs({type: 'discrete'});
ct2.append('feFuncB').attrs({type: 'discrete'});

var draw_map_basics = function draw_map_basics() {
  /*
   Draw ocean, land background, region boundaries, graticule.
   */
  dims = get_viewport_dimensions();

  ocean_layer.append('path')
    .datum({type: 'Sphere'})
    .attr('id', 'sphere')
    .attr('d', path)
    .attr('class', 'boundary');
  ocean_layer.append('use')
    .attr('class', 'stroke')
    .attr('xlink:href', '#sphere');
  ocean_layer.append('path')
    .datum(graticule)
    .attr('class', 'graticule boundary')
    .attr('d', path)
    .style('stroke', '#B4D5E5')
    .style('stroke-width', '1px')
    .style('fill', 'transparent');

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
