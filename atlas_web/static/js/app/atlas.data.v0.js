'use strict';

var update_data_fills = function update_data_fills() {
  /*
   Update color fills of pixels in data raster.
   */
  d3.selectAll('.grid-boundary').style('fill', function(d) {
    return d.properties.value.values[_time] == null
      ? 'transparent' : color(d.properties.value.values[_time]);
  });
};

var grid_hover = function grid_hover(d) {
  var q = '[' + (d.geometry.coordinates[0][0][0] +.25) + ', ';
  q += (d.geometry.coordinates[0][0][1] +.25) + '] <b>';
  q += (Math.round(d.properties.value.values[_time] * 100) / 100) + '</b>' ;
  hover_legend.select('p').html(q);
  hover_legend.style({
    left: d3.mouse(this)[0] + 'px',
    top: d3.mouse(this)[1] + 'px',
    display: 'block'
  });
  hover_legend.classed('hovered', true);
};

var get_dataset_for_viewport = function get_dataset_for_viewport(url, f) {
  d3.request(url)
    .send('post', JSON.stringify({
      tlx: dims['top_left'][0],
      tly: dims['top_left'][1],
      brx: dims['bottom_right'][0],
      bry: dims['bottom_right'][1]}), function(err, data) {
      f(null, JSON.parse(data.response)); })
};

var get_grid_data_by_bbox = function get_grid_data_by_bbox(dataset) {
  /*
   Retrieve gridded data within bounding box of viewport.
   */
  show_loader();
  dims = get_viewport_dimensions();
  d3.request('/api/griddata')
    .header("Content-Type", "application/json")
    .post(
      JSON.stringify({bbox: [dims['top_left'][0], dims['top_left'][1],
        dims['bottom_right'][0], dims['bottom_right'][1]],
        dataset: dataset}),
      function(err, rawData){
        //TODO: get datatype from Options object
        atlas(err, {data_type: 'raster', data: JSON.parse(rawData['response'])});
      }
  );
  //TODO: last_data_request()
};

var get_agg_by_regions = function get_agg_by_regions(dataset, regions) {
  /*
   Retrieve spatially aggregated polygons that intersect bounding box of
   viewport.
   */
  show_loader();
  dims = get_viewport_dimensions();
  d3.request('/api/aggregate')
    .header("Content-Type", "application/json")
    .post(
      JSON.stringify({bbox: [dims['top_left'][0], dims['top_left'][1],
        dims['bottom_right'][0], dims['bottom_right'][1]],
        dataset: dataset, regions: regions}),
      function(err, rawData){
        atlas(err, {data_type: 'agg', data: JSON.parse(rawData['response'])});
      }
  );
  //TODO: last_data_request()
};

var draw_areas_by_time = function draw_areas_by_time(data, idx) {

  var grouped_data = new Array(color.range().length);
  color.range().forEach( function(d, i) {
    grouped_data[i] = {'type': 'Feature', 'geometry': {
      'type': 'MultiPolygon', 'coordinates': []
    }, 'properties': {'values': []}}
  });

  data.forEach(function(d) {

    var x = d.properties.centroid.geometry.coordinates[0];
    var y = d.properties.centroid.geometry.coordinates[1];

    // TODO: Need dynamic resolution
    var s = .25;

    idx = color.range().indexOf(color(d.properties.value.values[_time]));
    grouped_data[idx].geometry.coordinates.push(
      [[[x-s, y+s], [x+s, y+s], [x+s, y-s], [x-s, y-s], [x-s, y+s]]]
    );
    grouped_data[idx].properties.values.push(d.properties.value.values[_time]);
  });

  return grouped_data;

};

var metadata_list = function metadata_list() {
  d3.request(api_root + 'rastermeta')
    // .header("Content-Type", "application/json")
    .get(function(err, rawData){
      var this_data = JSON.parse(rawData['response']);
      var md = d3.select('#metadata_list ul');
      md.data(this_data['response']['data'])
        .enter()
        .append('li');
      md.append('h4')
        .text(function(d) { return d.long_name; });
      md = md.append('ul');
      md.selectAll('li')
        .data(function(d) { return d.vars; })
        .enter()
        .append('li')
        .styles({display: 'inline-block', margin: '.25em 2em .5em 0'})
        .append('a')
        .attr('href', function(d) {
          return '/map/dataset/' +
            d3.select(this.parentNode.parentNode).datum().uid +
            '/var/' +
            d.uid; })
        .text(function(d) { return search_metadata_vars('long_name', d.attrs)['value']; })
    });
};

var search_metadata_vars = function search_metadata_vars(key, array) {
    for (var i=0; i < array.length; i++) {
        if (array[i].name === key) {
            return array[i]; } }
};

var process_raster_geometry = function process_raster_geometry(data) {
  /*
   Assuming the API returns centroids of data raster pixels as
   GeoJSON Point objects, turn them into Polygons.
   */
  data.forEach(function (d) {

    var x = d.properties.centroid.geometry.coordinates[0];
    var y = d.properties.centroid.geometry.coordinates[1];

    // TODO: Need dynamic resolution
    var s = 0.25;

    d.geometry = {
      type: 'Polygon',
      coordinates: [[[x - s, y + s], [x + s, y + s], [x + s, y - s],
        [x - s, y - s], [x - s, y + s]]]}
  });
  return data;
};