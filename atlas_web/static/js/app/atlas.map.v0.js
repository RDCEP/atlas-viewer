
var AtlasApp = (function (atlas) {

  'use strict';

  /*
  svg
  projection
  path
  graticule
  update_map_regions()
    Update boundaries of map overlay
  draw_map_basics()
    Draw ocean, empty land, region boundaries, graticule
  get_map_scale()
   */

  var svg_wrap = d3.select('#map')
    , svg_root = svg_wrap.append('svg')
      .attr('width', atlas.width)
      .attr('height', atlas.height)
      .attr('viewBox', '0 0 ' + atlas.width + ' ' + atlas.height)
    , filter = svg_root.append('defs')
      .append('filter')
      .attr('id', 'grid_filter')
      .attr('x', 0)
      .attr('y', 0)
    , svg = svg_root.append('g')
    , ocean_layer = svg.append('g')
      .attr('class', 'ocean layer zoom')
    , grid_layer = svg.append('g')
      .attr('class', 'grid layer zoom')
      .attr('filter', 'url(#grid_filter)')
    , boundary_layer = svg.append('g')
      .attr('class', 'boundary layer zoom')
      .classed('zoom', true)
    , ui_layer = svg.append('g')
      .attr('class', 'ui layer')
  ;

  // These filters are used for browser-based color smoothing
  filter.append('feGaussianBlur')
    .attr('stdDeviation', 0)
    .attr('in', 'BackgroundImage');
  var transfer = filter.append('feComponentTransfer')
    .attr('color-interpolation-filters', 'sRGB')
    .attr('in', 'BackgroundImage');
  transfer.append('feFuncR').attr('type', 'discrete');
  transfer.append('feFuncG').attr('type', 'discrete');
  transfer.append('feFuncB').attr('type', 'discrete');

  var _get_map_scale = function _get_map_scale() {
    return d3.max([atlas.height, atlas.width]) * Options.scale;
  };

  var _update_map_regions = function _update_map_regions() {

    d3.selectAll('.geo.region').remove();

    d3.request('/api/map')
      .header('Content-Type', 'application/json')
      .post(
        JSON.stringify({
          bbox: [atlas.bbox.top_left[0], atlas.bbox.top_left[1],
            atlas.bbox.bottom_right[0], atlas.bbox.bottom_right[1]],
          regions: Options.regions
        }),
        function (err, world) {

          world = JSON.parse(world.response);

          ocean_layer.selectAll('path.geo.region')
            .data(world)
            .enter()
            .append('path')
            .attr('d', atlas.path)
            .attr('class', 'geo region fill');
          boundary_layer.selectAll('path.geo.region')
            .data(world)
            .enter()
            .append('path')
            .attr('d', atlas.path)
            .attr('class', 'geo region boundary');
        });
  };

  var _draw_map_basics = function draw_map_basics() {
    /*
     Draw ocean, land background, region boundaries, graticule.
     */
    //FIXME: Replace dims with object's bbox
    // atlas.bbox = atlas.get_viewport_dimensions();

    ocean_layer.append('path')
      .datum({type: 'Sphere'})
      .attr('id', 'sphere')
      .attr('d', atlas.path)
      .attr('class', 'geo');
    ocean_layer.append('use')
      .attr('class', 'stroke')
      .attr('xlink:href', '#sphere');
    ocean_layer.append('path')
      .datum(atlas.graticule)
      .attr('class', 'graticule geo')
      .attr('d', atlas.path)
  };

  atlas.update_map_regions = function() {
    return _update_map_regions();
  };
  atlas.draw_map_basics = function() {
    return _draw_map_basics;
  };
  atlas.get_map_scale = function() {
    return _get_map_scale;
  };

  // Black/white color scale for map. SVG filters create colors using
  // component replacement.
  atlas.color = d3.scaleLinear()
    .range([d3.rgb('white'), d3.rgb('black')]);

  atlas.svg = svg;
  atlas.projection = d3.geoEquirectangular()
      .rotate([-Options.lon, 0])
      .center([0, Options.lat])
      .scale(atlas.get_map_scale())
      .translate([atlas.width / 2, atlas.height / 2])
      .precision(.1);
  atlas.path = d3.geoPath()
    .projection(atlas.projection);
  atlas.graticule = d3.geoGraticule();

  return atlas;

})(AtlasApp || {});