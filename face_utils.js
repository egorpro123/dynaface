
exports.correct_num_str = function (val, format) {
  var len = parseInt(format.split(/[.,]/)[0] || '0'),
      dec = parseInt(format.split(/[.,]/)[1] || '0');
  
  if (dec === 0) return val.replace(/^\D+/, '').replace(/[^\d]+/g, '').
      replace(RegExp('(.{' + len + '}).*$'),'$1')
  else {
    return val.replace(/^\D+/, '').replace(/[^.,\d]+/g, '').
      replace(/[\.,]+/, '.').replace(RegExp('(.{' + len + '}).*$'),'$1').
      replace(RegExp('(\\d+\\.\\d{' + dec + '}).*$'), '$1');
  }
};
