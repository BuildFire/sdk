'use strict';

/**
 * An AngularJS directive for adding [Google Places Autocomplete](https://developers.google.com/places/webservice/autocomplete)
 * to an input text element, based on [Will Palahnuk directive](http://github.com/wpalahnuk/ngAutocomplete).
 *
 * This fork allow the address validation : input.$valid will be false as long as the user has not selected an address provided
 * by the Google API. To use this, add required="required" to your input tag.
 **/

angular.module( "ngAutocomplete", [])
    .directive('ngAutocomplete', function() {
      return {
        require: 'ngModel',
        scope: {
          ngModel: '=',
          options: '=?',
          details: '=?',
          valid : '=?',
          callback : '=?'
        },

        link: function(scope, element, attrs, controller) {

          //options for autocomplete
          var opts;
          var watchEnter = false;
          var required = false;
          //convert options provided to opts
          var initOpts = function() {

            opts = {};
            if (scope.options) {

              if (scope.options.watchEnter === true) {
                watchEnter = true;
              }

              if (scope.options.types) {
                opts.types = [];
                opts.types.push(scope.options.types);
                scope.gPlace.setTypes(opts.types);
              } else {
                scope.gPlace.setTypes([]);
              }

              if (scope.options.bounds) {
                opts.bounds = scope.options.bounds;
                scope.gPlace.setBounds(opts.bounds);
              } else {
                scope.gPlace.setBounds(null);
              }

              if (scope.options.country) {
                opts.componentRestrictions = {
                  country: scope.options.country
                };
                scope.gPlace.setComponentRestrictions(opts.componentRestrictions);
              } else {
                scope.gPlace.setComponentRestrictions(null);
              }

              if (scope.options.strict) {
                opts.strict = scope.options.strict;
              }
              else {
                opts.strict = false;
              }
            }

            if (element.attr('required')) {
              required = true;
            }

          };

          if (scope.gPlace == undefined) {
            scope.gPlace = new google.maps.places.Autocomplete(element[0], {});
          }
          google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
            var result = scope.gPlace.getPlace();
            if (result !== undefined) {
              if (result.address_components !== undefined) {

                scope.$apply(function() {

                  scope.details = result;
                  scope.valid = true;

                  controller.$setViewValue(element.val());
                  controller.$setValidity('invalidAddress', true);
                });
              }
              else {
                if (watchEnter) {
                  getPlace(result, function() {
                    scope.valid = true;
                    controller.$setValidity('invalidAddress', true);
                  });
                }
              }
            }
          });

          //function to get retrieve the autocompletes first result using the AutocompleteService
          var getPlace = function(result, callback) {
            var autocompleteService = new google.maps.places.AutocompleteService();
            if (result.name.length > 0){
              autocompleteService.getPlacePredictions(
                  {
                    input: result.name,
                    offset: result.name.length
                  },
                  function listentoresult(list, status) {
                    if(list == null || list.length == 0) {

                      scope.$apply(function() {
                        scope.details = null
                        scope.valid = false;;
                      });

                      if (typeof callback == 'function') { callback(); }

                    } else {
                      if (opts.strict) {
                        var placesService = new google.maps.places.PlacesService(element[0]);
                        placesService.getDetails(
                            {'placeId': list[0].place_id},
                            function detailsresult(detailsResult, placesServiceStatus) {

                              if (placesServiceStatus == google.maps.GeocoderStatus.OK) {
                                scope.$apply(function() {

                                  controller.$setViewValue(detailsResult.formatted_address);
                                  element.val(detailsResult.formatted_address);

                                  scope.details = detailsResult
                                  scope.valid = true;

                                  //on focusout the value reverts, need to set it again.
                                  element.on('focusout', function(event) {
                                    element.val(detailsResult.formatted_address);
                                    element.unbind('focusout')
                                  });

                                  if (typeof callback == 'function') { callback(); }
                                });
                              }
                            }
                        );
                      }
                      else {
                        var addr = list[0].description;
                        scope.$apply(function() {

                          controller.$setViewValue(addr);
                          element.val(addr);

                          //on focusout the value reverts, need to set it again.
                          element.on('focusout', function(event) {
                            element.unbind('focusout');
                            setTimeout(function () {
                              element.val(addr);
                            }, 100);
                          });
                          if (typeof callback == 'function') { callback(); }
                        });
                      }

                    }
                  });
            }
          };

          controller.$render = function () {
            var location = controller.$viewValue;
            element.val(location);
          };

          //watch options provided to directive
          scope.watchOptions = function () {
            return scope.options
          };
          scope.$watch(scope.watchOptions, function () {
            initOpts()
          }, true);

          scope.$watch(function() {
            return controller.$modelValue;
          }, function(newValue, oldValue) {
            if (typeof oldValue == 'undefined' && oldValue != newValue) {
              if (newValue.length > 2) {
                var res = {name: newValue};
                getPlace(res, function(){
                  scope.valid= true;
                  controller.$setValidity('invalidAddress', true);
                });
              }
            }
            else {
              if (required) {
                if (typeof newValue == 'undefined' || !newValue || newValue.length < oldValue.length || newValue.length < 2)
                  scope.valid= false;{
                  controller.$setValidity('invalidAddress', false);
                }
              }
              // if the input field is not required, do not validate the address
            }
          })
        }
      };
    });