
var AtlasUI = (function (ui) {

  'use strict';

  ui.get_map_scale = function get_map_scale() {
    return d3.max([ui.height, ui.width]) * Options.scale;
  };

  var svg_wrap = d3.select('#map')
    , svg_root = svg_wrap.append('svg')
      .attr('width', ui.width)
      .attr('height', ui.height)
      .attr('viewBox', '0 0 ' + ui.width + ' ' + ui.height)
    , filter = svg_root.append('defs')
      .append('filter')
      .attr('id', 'grid_filter')
      .attr('x', 0)
      .attr('y', 0)
    , svg = svg_root.append('g')
    , ocean_layer = svg.append('g')
      .attr('id', 'ocean_layer')
      .classed('zoom', true)
    , grid_layer = svg.append('g')
      .attr('id', 'grid_layer')
      .classed('zoom', true)
      .attr('filter', 'url(#grid_filter)')
    , boundary_layer = svg.append('g')
      .attr('id', 'boundary_layer')
      .classed('zoom', true)
    , legend_layer = svg.append('g')
      .attrs({id: 'legend_layer'})
  ;

  ui.projection = d3.geoEquirectangular()
      .rotate([-Options.lon, 0])
      .center([0, Options.lat])
      .scale(ui.get_map_scale())
      .translate([ui.width / 2, ui.height / 2])
      .precision(.1);
  ui.path = d3.geoPath()
    .projection(ui.projection);
  ui.graticule = d3.geoGraticule();

  filter.append('feGaussianBlur')
    .attrs({stdDeviation: 0, result: 'gaussian_blur'});
  ui.component_transfer_filter = filter.append('feComponentTransfer')
    .attr('in', 'gaussian_blur');
  ui.component_transfer_filter.append('feFuncR').attrs({type: 'discrete'});
  ui.component_transfer_filter.append('feFuncG').attrs({type: 'discrete'});
  ui.component_transfer_filter.append('feFuncB').attrs({type: 'discrete'});

  var _update_map_regions = function _update_map_regions() {

    d3.selectAll('.geo.region').remove();

    d3.request('/api/map')
      .header('Content-Type', 'application/json')
      .post(
        JSON.stringify({
          bbox: [ui.bbox.top_left[0], ui.bbox.top_left[1],
            ui.bbox.bottom_right[0], ui.bbox.bottom_right[1]],
          regions: Options.regions
        }),
        function (err, world) {

          world = JSON.parse(world.response);

          ocean_layer.selectAll('path.geo.region')
            .data(world)
            .enter()
            .append('path')
            .attr('d', ui.path)
            .attr('class', 'geo region')
            .style('stroke', 'none')
            .style('fill', '#dddddd');

          boundary_layer.selectAll('path.geo.region')
            .data(world)
            .enter()
            .append('path')
            .attr('d', ui.path)
            .attr('class', 'geo region')
            .style('stroke', '#666')
            .style('stroke-width', 1)
            .style('stroke-line-join', 'round')
            .style('fill', 'none');

        });
  };

  var _draw_map_basics = function draw_map_basics() {
    /*
     Draw ocean, land background, region boundaries, graticule.
     */
    //FIXME: Replace dims with object's bbox
    // ui.bbox = ui.get_viewport_dimensions();

    ocean_layer.append('path')
      .datum({type: 'Sphere'})
      .attr('id', 'sphere')
      .attr('d', ui.path)
      .attr('class', 'geo');
    ocean_layer.append('use')
      .attr('class', 'stroke')
      .attr('xlink:href', '#sphere');
    ocean_layer.append('path')
      .datum(ui.graticule)
      .attr('class', 'graticule geo')
      .attr('d', ui.path)
      .style('stroke', '#B4D5E5')
      .style('stroke-width', '1px')
      .style('fill', 'transparent');

  };

  ui.svg = svg;
  ui.update_map_regions = _update_map_regions;
  ui.draw_map_basics = _draw_map_basics;

  return ui;

})(AtlasUI || {});