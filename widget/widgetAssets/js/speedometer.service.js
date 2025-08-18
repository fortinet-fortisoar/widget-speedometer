/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
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
            executeAction: executeAction,
            generateGradient: generateGradient
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

        /**
         * @ngdoc method
         * @name fortitip.generateGradient
         * @methodOf fortitip.speedometerService
         *
         * @description
         * This generate gradient stop color for speedometer arc fill and returns the gradient stop color
         *
         * @param  {String} color color whose gradient has to be generated
         * @param  {Number} percent depth of darkness of the color, Negative values is more darker
         * @return {String}  returns the gradient stop color
        */
        function generateGradient(color, percent) {
            // Function to adjust brightness
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);

            R = parseInt((R * (100 + percent)) / 100);
            G = parseInt((G * (100 + percent)) / 100);
            B = parseInt((B * (100 + percent)) / 100);

            R = R < 255 ? R : 255;
            G = G < 255 ? G : 255;
            B = B < 255 ? B : 255;

            let RR = (R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16));
            let GG = (G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16));
            let BB = (B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16));

            return "#" + RR + GG + BB;
        }

        return service;
    }
})();
