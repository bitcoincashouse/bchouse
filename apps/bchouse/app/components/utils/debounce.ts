export function debounce(fn: any, delay: any) {
  var timer: any = null;
  return function(this: any) {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}