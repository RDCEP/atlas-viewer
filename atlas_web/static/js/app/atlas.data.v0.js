
var AtlasApp = (function (atlas) {

  'use strict';

  /*
  color
  update_data_fills()
  process_raster_geometry()
  get_data()
   */

  var _update_data_fills = function _update_data_fills() {
    /*
     Update color fills of pixels in data raster.
     */
    d3.selectAll('.grid.geo').style('fill', function(d) {
      return d.properties.value.values[atlas._time] == null
        ? 'transparent' : atlas.color(d.properties.value.values[atlas._time]);
    });
  };

  var _sort_data_by_values = function _sort_data_by_values(data) {

    data.sort(function (a, b) {
      d3.ascending(
        [
          d3.ascending(
            a.properties.centroid.geometry.coordinates[0],
            b.properties.centroid.geometry.coordinates[0]),
          d3.ascending(
            a.properties.centroid.geometry.coordinates[1],
            b.properties.centroid.geometry.coordinates[1])
        ], [
          d3.ascending(
            b.properties.centroid.geometry.coordinates[0],
            a.properties.centroid.geometry.coordinates[0]),
          d3.ascending(
            b.properties.centroid.geometry.coordinates[1],
            a.properties.centroid.geometry.coordinates[1])]
      )
    });

    return data;

  };

  var _process_raster_geometry = function _process_raster_geometry(data) {
    /*
     Assuming the API returns centroids of data raster pixels as
     GeoJSON Point objects, turn them into Polygons.
     */

    atlas.sort_data_by_values(data);

    data.forEach(function (d) {

      var x = d.properties.centroid.geometry.coordinates[0];
      var y = d.properties.centroid.geometry.coordinates[1];

      // TODO: Need dynamic resolution
      var s = 0.25;

      d.geometry = {
        type: 'Polygon',
        coordinates: [[
          [x - s, y + s], // top left
          [x + s, y + s], // top right
          [x + s, y - s], // bottom right
          [x - s, y - s], // bottom left
          [x - s, y + s]
        ]]};
    });

    return data;

  };

  var _get_data = function _get_data(data_type) {

    if (data_type === null) { return false; }

    var endpoint = data_type === 'raster'
      ? 'griddata'
      : 'aggregate';

    atlas.show_loader();

    d3.request('/api/' + endpoint)
      .header('Content-Type', 'application/json')
      .post(
        JSON.stringify({bbox: [atlas.bbox.top_left[0], atlas.bbox.top_left[1],
          atlas.bbox.bottom_right[0], atlas.bbox.bottom_right[1]],
          dataset: Options.dataset, regions: Options.regions}),
        function(err, rawData){
          atlas.atlas(err, {data_type: data_type,
            data: JSON.parse(rawData['response'])});
        }
    );
  };

  atlas.update_data_fills = function() {
    return _update_data_fills();
  };

  atlas.process_raster_geometry = function(data) {
    return _process_raster_geometry(data);
  };

  atlas.get_data = function(endpoint) {
    return _get_data(endpoint);
  };

  atlas.sort_data_by_values = function(data) {
    return _sort_data_by_values(data);
  };

  return atlas;

})(AtlasApp || {});