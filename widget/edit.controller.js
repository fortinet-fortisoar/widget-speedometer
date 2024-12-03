/* Copyright start
  Copyright (C) 2008 - 2024 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editSpeedometer100Ctrl', editSpeedometer100Ctrl);

    editSpeedometer100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout','appModulesService', 'Entity', 'modelMetadatasService'];

    function editSpeedometer100Ctrl($scope, $uibModalInstance, config, widgetUtilityService, $timeout, appModulesService, Entity, modelMetadatasService) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.config = config;

        function _handleTranslations() {
          let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);
          
          if (widgetNameVersion) {
            widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
              $scope.viewWidgetVars = {
                // Create your translating static string variables here
                LABEL_SELECT_AN_OPTION: "Select an Option",
                LABEL_RESOURCE: "Resource"
              };
            });
            loadModules();
          } else {
            $timeout(function() {
              $scope.cancel();
            });
          }
        }

        function loadModules() {
          appModulesService.load(true).then(function (modules) {
            $scope.modules = modules;
            //Create a list of modules with atleast one JSON field
            $scope.modules.forEach((module) => {
              var moduleMetaData = modelMetadatasService.getMetadataByModuleType(module.type);
              for (let fieldIndex = 0; fieldIndex < moduleMetaData.attributes.length; fieldIndex++) {
                //Check If JSON field is present in the module
                if (moduleMetaData.attributes[fieldIndex].type === "object") {
                  $scope.jsonObjModuleList.push(module);
                  break;
                }
              }
            });
          });
          if ($scope.config.resource) {
            $scope.loadAttributes();
          }
        }

        $scope.loadAttributes = function() {
          $scope.fields = [];
          $scope.fieldsArray = [];
          $scope.pickListFields = [];
          $scope.userField = [];
          var entity = new Entity($scope.config.resource);
          entity.loadFields().then(function() {
            for (var key in entity.fields) {
              if (entity.fields[key].type === 'datetime') {
                entity.fields[key].type = 'datetime.quick';
              } else if (entity.fields[key].type === 'picklist') {
                $scope.pickListFields.push(entity.fields[key]);
              } 
            }
    
            $scope.fields = entity.getFormFields();
            angular.extend($scope.fields, entity.getRelationshipFields());
            $scope.fieldsArray = entity.getFormFieldsArray();
          });
        };
  
        
        function init() {
            // To handle backward compatibility for widget
            _handleTranslations();
        }

        init();

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function save() {
            $uibModalInstance.close($scope.config);
        }

    }
})();
