/* Copyright start
    MIT License
    Copyright (c) 2024 Fortinet Inc
Copyright end */
  'use strict';

  (function () {
      angular
          .module('cybersponse')
          .factory('speedometerService', speedometerService);
  
      speedometerService.$inject = ['$q', '$http', 'Query', 'API', 'ALL_RECORDS_SIZE', '$resource', 'connectorService'];
  
      function speedometerService($q, $http, Query, API, ALL_RECORDS_SIZE, $resource, connectorService) {
          var service;
          service = {
              getResourceAggregate: getResourceAggregate,
              executeAction: executeAction
          };
  
          //to fetch modules data through API query
          function getResourceAggregate(_config) {
              var defer = $q.defer();
              var queryObject = {
                  aggregates: [
                      {
                          'operator': 'count',
                          'field': '*',
                          'alias': 'total'
                      },
                      {
                          "operator": "groupby",
                          "alias": _config.picklistField,
                          "field": _config.picklistField + '.itemValue'
                      },
                      {
                          "operator": "groupby",
                          "alias": "color",
                          "field": _config.picklistField + ".color"
                      }
                  ],
                  relationship: true
              };
              var _queryObj = new Query(queryObject);
              $http.post(API.QUERY + _config.resource + '?$limit=' + ALL_RECORDS_SIZE, _queryObj.getQuery(true)).then(function (response) {
                  defer.resolve(response);
              }, function (error) {
                  defer.reject(error);
              });
              return defer.promise;
          }
  
          //execute connection action
          function executeAction(connector_name, connector_action, payload) {
              return $resource(API.INTEGRATIONS + 'connectors/?name=' + connector_name)
                  .get()
                  .$promise
                  .then(function (connectorMetaDataForVersion) {
                      let defaultConfig = connectorMetaDataForVersion.data[0].configuration.filter(item => item.default);
                      if (defaultConfig) {
                          var config_id = defaultConfig[0]['config_id'];
                      }
                      else {
                          toaster.error({ body: 'Default configuration not present.' });
                      }
                      return connectorService.executeConnectorAction(connector_name, connectorMetaDataForVersion.data[0].version, connector_action, config_id, payload);
                  })
                  .catch(function (error) {
                      console.error('Error:', error);
                      throw error; // Rethrow the error to be handled by the caller
                  });
          }
  
          return service;
      }
  })();
  