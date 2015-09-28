// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    /*if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }*/
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.controller('DocCtrl', function($scope) {
  $scope.pdfUrl = 'https://www.aeaweb.org/sample_references.pdf';
  $scope.scroll = 0;
  $scope.loading = 'loading';

  $scope.getNavStyle = function(scroll) {
    if(scroll > 100) return 'pdf-controls fixed';
    else return 'pdf-controls';
  }

  $scope.onError = function(error) {
    console.log(error);
  }

  $scope.onLoad = function() {
    $scope.loading = '';
  }

  $scope.onProgress = function(progress) {
    console.log(progress);
  }

})
.directive('ngPdf', [ '$window', function($window) {
    var backingScale = function(canvas) {
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var bsr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

      return dpr / bsr;
    };

    var setCanvasDimensions = function(canvas, w, h) {
      var ratio = backingScale(canvas);
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = Math.floor(w) + 'px';
      canvas.style.height = Math.floor(h) + 'px';
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
      return canvas;
    };
    return {
      restrict: 'E',
      templateUrl: function(element, attr) {
        return attr.templateUrl ? attr.templateUrl : 'partials/viewer.html';
      },
      link: function(scope, element, attrs) {
        var url = scope.pdfUrl;
        var pdfDoc = null
        var pageNum = (attrs.page ? attrs.page : 1);
        var scale = attrs.scale > 0 ? attrs.scale : 1;
        var canvas = (attrs.canvasid ? document.getElementById(attrs.canvasid) : document.getElementById('pdf-canvas'));
        var ctx = canvas.getContext('2d');
        var windowEl = angular.element($window);

        windowEl.on('scroll', function() {
          scope.$apply(function() {
            scope.scroll = windowEl[0].scrollY;
          });
        });

        PDFJS.disableWorker = true;
        scope.pageNum = pageNum;

        scope.renderPage = function(num) {
          pdfDoc.getPage(num).then(function(page) {
            var viewport;
            var pageWidthScale;
            var pageHeightScale;
            var renderContext = {};
            var pageRendering;

            if (attrs.scale === 'page-fit' && !scale) {
              viewport = page.getViewport(1);
              pageWidthScale = element[0].clientWidth / viewport.width;
              pageHeightScale = element[0].clientHeight / viewport.height;
              scale = Math.min(pageWidthScale, pageHeightScale);
            } else {
              viewport = page.getViewport(scale)
            }

            setCanvasDimensions(canvas, viewport.width, viewport.height);

            renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
              if (typeof scope.onPageRender === 'function' ) {
                scope.onPageRender();
              }
            });
          });
        };

        scope.goPrevious = function() {
          if (scope.pageToDisplay <= 1) {
            return;
          }
          scope.pageNum = parseInt(scope.pageNum) - 1;
        };

        scope.goNext = function() {
          if (scope.pageToDisplay >= pdfDoc.numPages) {
            return;
          }
          scope.pageNum = parseInt(scope.pageNum) + 1;
        };

        scope.zoomIn = function() {
          scale = parseFloat(scale) + 0.2;
          scope.renderPage(scope.pageToDisplay);
          return scale;
        };

        scope.zoomOut = function() {
          scale = parseFloat(scale) - 0.2;
          scope.renderPage(scope.pageToDisplay);
          return scale;
        };

        scope.changePage = function() {
          scope.renderPage(scope.pageToDisplay);
        };

        scope.rotate = function() {
          if (canvas.getAttribute('class') === 'rotate0') {
            canvas.setAttribute('class', 'rotate90');
          } else if (canvas.getAttribute('class') === 'rotate90') {
            canvas.setAttribute('class', 'rotate180');
          } else if (canvas.getAttribute('class') === 'rotate180') {
            canvas.setAttribute('class', 'rotate270');
          } else {
            canvas.setAttribute('class', 'rotate0');
          }
        };

        function renderPDF() {
          if (url && url.length) {
            PDFJS.getDocument(url, null, null, scope.onProgress).then(
                function(_pdfDoc) {
                  if (typeof scope.onLoad === 'function') {
                    scope.onLoad();
                  }

                  pdfDoc = _pdfDoc;
                  scope.renderPage(scope.pageToDisplay);

                  scope.$apply(function() {
                    scope.pageCount = _pdfDoc.numPages;
                  });
                }, function(error) {
                  if (error) {
                    if (typeof scope.onError === 'function') {
                      scope.onError(error);
                    }
                  }
                }
            );
          }
        }

        scope.$watch('pageNum', function(newVal) {
          scope.pageToDisplay = parseInt(newVal);
          if (pdfDoc !== null) {
            scope.renderPage(scope.pageToDisplay);
          }
        });

        scope.$watch('pdfUrl', function(newVal) {
          if (newVal !== '') {
            console.log('pdfUrl value change detected: ', scope.pdfUrl);
            url = newVal;
            scope.pageToDisplay = 1;
            renderPDF();
          }
        });

      }
    };
} ]);

