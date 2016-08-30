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