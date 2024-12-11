/* Copyright start
  Copyright (C) 2008 - 2024 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('speedometer100Ctrl', speedometer100Ctrl);

  speedometer100Ctrl.$inject = ['$scope', 'widgetUtilityService', 'config', '$state', 'speedometerService', 'modelMetadatasService'];

  function speedometer100Ctrl($scope, widgetUtilityService, config, $state, speedometerService, modelMetadatasService) {

    $scope.config = config;
    $scope.pageState = $state;
    function _handleTranslations() {
      widgetUtilityService.checkTranslationMode($scope.$parent.model.type).then(function () {
        $scope.viewWidgetVars = {
          // Create your translating static string variables here
        };
      });
    }

    function init() {
      // To handle backward compatibility for widget
      _handleTranslations();
      checkCurrentPage($scope.pageState);
      var moduleMetaData = modelMetadatasService.getMetadataByModuleType($scope.config.resource);
        $scope.multipleFieldsItems = $scope.config.multipleFieldsItems;
        //to check if dataSource is present and fetch data from connector action or else from API query
        if(moduleMetaData.dataSource){ 
          executeConnectorAction(moduleMetaData.dataSource);
        } 
    }

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees) * (Math.PI / 180);
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    }

    function describeArc(x, y, radius, startAngle, endAngle) {
      const start = polarToCartesian(x, y, radius, startAngle);
      const end = polarToCartesian(x, y, radius, endAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

      return [
        "M",
        start.x,
        start.y, // Move to starting point
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        1, // Sweep clockwise
        end.x,
        end.y, // End point
      ].join(" ");
    }

    function updateSpeedometer(percentage) {
      $scope.riskPercentage = percentage ? percentage : 0;
      $scope.startRiskColor = mapRiskColor($scope.scoreField).startRiskColor;
      $scope.stopRiskColor = mapRiskColor($scope.scoreField).endRiskColor;

      const startAngle = 135; // Ensure alignment with background arc's start
      const endAngle = 135 + (percentage / 100) * 270; // Map percentage to 180-degree span
      const path = document.getElementById("progress-arc");

      // Update the arc path dynamically
      path.setAttribute(
        "d",
        describeArc(150, 150, 100, startAngle, endAngle) // Center (150,150), radius 100
      );
      path.setAttribute("stroke", "url(#gradient)");

      // Update needle rotation dynamically
      const needle = document.querySelector(".needle");
      const needleAngle = -135 + (percentage * 270) / 100; // Map percentage to range [-135, 90]
      setTimeout(() => {
        needle.style.transform = `rotate(${needleAngle}deg)`;
      }, 10);
    }
  
    function mapRiskColor(riskKey){
      if (typeof riskKey != 'string') {
        return '';
      }
      switch (riskKey.toLowerCase().trim()) {
        case 'high':
          return {'startRiskColor' : '#F66E4F',  'endRiskColor': '#E60C4B'};
          break;
        case 'low':
          return {'startRiskColor' : '#fdfc00',  'endRiskColor': '#fac602'};
          break;
        case 'moderate':
          return {'startRiskColor' : '#07de04',  'endRiskColor': '#6ac359'};
          break;
        case 'default':
          return {'startRiskColor' : '#5596be',  'endRiskColor': '#1d7fbb'};
        default:
          return 

      }
    }

    function checkCurrentPage(state){
      if (state.current.name.includes('viewPanel.modulesDetail')) {
        let params = $scope.pageState.current.params;
        $scope.indicator = params.id;
      }
    }

    function executeConnectorAction(_moduleMetaData){ 
      let _connectorName = _moduleMetaData.connector;
      let _connectorAction = _moduleMetaData.operation;
      let payload = { 'indicator': $scope.indicator || '8.8.8.8'};
      var valueParameter = $scope.config.picklistValue;
      var fieldParameter = $scope.config.picklistField;

      speedometerService.executeAction(_connectorName, _connectorAction, payload).then(function (response) {
        if(response && response.data)
        {
          $scope.scoreValue = response.data[valueParameter];
          $scope.scoreField = response.data[fieldParameter].itemValue;
          updateSpeedometer($scope.scoreValue);
        }
      });
    }

    init();
  }
})();
