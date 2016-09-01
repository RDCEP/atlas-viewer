
var AtlasUI = (function (ui) {

  'use strict';

  ui.color = d3.scaleLinear()
    .range([d3.rgb('white'), d3.rgb('black')]);

  var _update_data_fills = function _update_data_fills() {
    /*
     Update color fills of pixels in data raster.
     */
    d3.selectAll('.grid-boundary').style('fill', function(d) {
      return d.properties.value.values[ui._time] == null
        ? 'transparent' : ui.color(d.properties.value.values[ui._time]);
    });
  };

  var _get_grid_data_by_bbox = function _get_grid_data_by_bbox(dataset) {
    /*
     Retrieve gridded data within bounding box of viewport.
     */
    ui.show_loader();
    //FIXME: Replace dims with object's bbox
    ui.bbox = ui.get_viewport_dimensions();
    d3.request('/api/griddata')
      .header("Content-Type", "application/json")
      .post(
        JSON.stringify({bbox: [ui.bbox.top_left[0], ui.bbox.top_left[1],
          ui.bbox.bottom_right[0], ui.bbox.bottom_right[1]],
          dataset: dataset}),
        function(err, rawData){
          //TODO: get datatype from Options object
          ui.atlas(err, {data_type: 'raster', data: JSON.parse(rawData['response'])});
        }
    );
    //TODO: last_data_request()
  };

  var _get_agg_by_regions = function _get_agg_by_regions(dataset, regions) {
    /*
     Retrieve spatially aggregated polygons that intersect bounding box of
     viewport.
     */
    ui.show_loader();
    dims = ui.get_viewport_dimensions();
    d3.request('/api/aggregate')
      .header("Content-Type", "application/json")
      .post(
        JSON.stringify({bbox: [ui.bbox.top_left[0], ui.bbox.top_left[1],
          ui.bbox.bottom_right[0], ui.bbox.bottom_right[1]],
          dataset: dataset, regions: regions}),
        function(err, rawData){
          atlas(err, {data_type: 'agg', data: JSON.parse(rawData['response'])});
        }
    );
    //TODO: last_data_request()
  };

  var _process_raster_geometry = function _process_raster_geometry(data) {
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

  ui.update_data_fills = function() {
    return _update_data_fills();
  };

  ui.get_grid_data_by_bbox = function(dataset) {
    return _get_grid_data_by_bbox(dataset)
  };

  ui.get_agg_by_regions = function (dataset, regions) {
    return _get_agg_by_regions(dataset, regions)
  };

  ui.process_raster_geometry = function(data) {
    return _process_raster_geometry(data);
  };

  return ui;

})(AtlasUI || {});