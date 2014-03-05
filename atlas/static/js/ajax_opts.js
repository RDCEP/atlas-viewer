(function() {
  var ajax_opts = d3.selectAll('.data-ajax');
  ajax_opts.on('click', function() {
    d3.event.preventDefault();
    var opt = d3.select(this),
      opt_type = opt.attr('data-type'),
      opt_value = opt.attr('data-value');
    if (opt_type == 'scenario') {
      _scen = opt_value;
    }
    if (opt_type == 'irrigation') {
      _irr = opt_value;
    }
    d3.xhr('/update/grid/adm/1/var/'+Options.var+'/type/'+opt_type+'/value/'+opt_value)
      .responseType('json')
      .post()
      .on('load', function(_data) {
        data = _data.response;
        d3.select('#corner_legend [data-type="'+opt_type+'"]').text(opt.text());
        update_data_fills(data);
      });
  });
})();