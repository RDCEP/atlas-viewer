
var update_data_fills = function update_data_fills() {
  grid_regions.each(function(d, i) {
    d3.select(this).style('fill', function() {
      if (group_data_test) {
        return color(d3.mean(d.properties.values))
      }
      return d.properties.value.values[_time] == null
        ? 'transparent' : color(d.properties.value.values[_time]);
    });
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
        atlas(err, {data_type: 'grid', data: JSON.parse(rawData['response'])});
      }
  );
  //TODO: last_data_request()
};

var get_agg_by_regions = function get_agg_by_regions(dataset, regions) {
  show_loader();
  dims = get_viewport_dimensions();
  d3.xhr('/api/aggregate')
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

