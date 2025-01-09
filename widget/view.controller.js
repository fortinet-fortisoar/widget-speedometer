/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('speedometer100Ctrl', speedometer100Ctrl);

  speedometer100Ctrl.$inject = ['$q','$scope', 'widgetUtilityService', 'config', '$state', 'speedometerService', 'modelMetadatasService', '$rootScope', 'Entity', '_'];

  function speedometer100Ctrl($q, $scope, widgetUtilityService, config, $state, speedometerService, modelMetadatasService, $rootScope, Entity, _) {

    $scope.config = config;
    $scope.pageState = $state;
    $scope.processing = true;
    $scope.currentTheme = $rootScope.theme.id;

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
      $scope.multipleFieldsItemsData = [];
        //to check if dataSource is present and fetch data from connector action or else from API query
        if(moduleMetaData.dataSource){ 
          getRecordDetails(moduleMetaData.dataSource);
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
      getRiskScorePicklistColor($scope.scoreField).then(function(response){
        $scope.startRiskColor = response.startRiskColor;
        $scope.stopRiskColor = response.endRiskColor;
      });
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

    //map risk color for speedometer through Confidence picklist value using entity form fields
    function getRiskScorePicklistColor(riskKey) {
      var defer = $q.defer();
      var entity = new Entity($scope.config.resource);
      entity.loadFields().then(function () {
        let formFields = entity.getFormFields();
        let _picklistValues = _.find(formFields, function (field) {
          return field.type === 'picklist' && field.name === $scope.config.picklistField;
        });
        if(_picklistValues.length > 0){
          let color = '';
          _.filter(_picklistValues[0].options, function (element) {
            if (element.itemValue === riskKey) {
              color = element.color;
            }
          });
          defer.resolve({'startRiskColor' : color,  'endRiskColor': speedometerService.generateGradient(color, -30)});
        }
        else{
          defer.reject();
        }
      });
      return defer.promise;
    }

    function checkCurrentPage(state){
      if (state.current.name.includes('viewPanel.modulesDetail')) {
        let params = $scope.pageState.current.params;
        $scope.indicator = params.id;
      }
    }

    //fetch record details through the connector action mentioned in the Data Source
    function getRecordDetails(_moduleMetaData){ 
      let _connectorName = _moduleMetaData.connector;
      let _connectorAction = _moduleMetaData.operation;
      let payload = { 'indicator': $scope.indicator };
      var valueParameter = $scope.config.picklistValue;
      var fieldParameter = $scope.config.picklistField;

      speedometerService.executeAction(_connectorName, _connectorAction, payload).then(function (response) {
        if(response && response.data)
        {
          $scope.processing = false;
          $scope.scoreValue = response.data[valueParameter];
          $scope.scoreField = response.data[fieldParameter].itemValue;
          updateSpeedometer($scope.scoreValue);
          setMultipleFieldsData(response.data);
        }
      });
    }

    function setMultipleFieldsData(_responseData){
      $scope.multipleFieldsItems.forEach(element => {
        if (_responseData[element.name]) {
          $scope.multipleFieldsItemsData.push({
            'field': element.title,
            'value': _responseData[element.name]
          });
        }
      });
    }

    init();
  }
})();
