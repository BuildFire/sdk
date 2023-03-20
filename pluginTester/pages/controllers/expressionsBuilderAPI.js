if (typeof (ExpressionBuilderAPI) == 'undefined') {
    window.ExpressionBuilderAPI = function (context) {
    }
}
ExpressionBuilderAPI.prototype.showDialog = function (data, callback) {
    const openDialogOptions = {
        templateUrl: 'pages/templates/expressionsBuilder.html',
        controller: 'expressionsBuilderCtrl',
        size: 'lg',
        data: data
    };

    window.openDialog(openDialogOptions, function (result) {
        if (callback)
            callback(null, result);
    });
};

$app.controller('expressionsBuilderCtrl', ['$scope', '$data', '$dialog', '$http', function ($scope, $data, $dialog, $http) {

    $scope.close = function () {
        $scope.$dialog.close(null);
    };

    $scope.useExpression = function () {
        $scope.$dialog.close($scope.expression.string);
    };

    $scope.appendPresetExpression = function (presetExpression) {
        $scope.expression.string = $scope.expression.string + presetExpression;
        if (!$scope.$$phase) $scope.$digest();
    };

    $scope.evaluate = function () {
        //Expression Service not implemented yet in plugin tester to be used.
        const dialogAPI = new DialogAPI({});
        dialogAPI.alert({
            message: "Expression Builder not available yet in Plugin Tester.",
          }, ()=>{});
          return;
        //reset values
        $scope.error = "";
        $scope.expression.evaluatedExpression = "";
        
        if (!dynamicEngine || !dynamicEngine.expressions || !dynamicEngine.expressions.evaluate) {
            $scope.error = "Dynamic Expressions Service not defined!";
            window.toast($scope.error, 'danger');
            return;
        }

        $scope.isEvaluateLoading = true;
        const options = {
            expression: $scope.expression.string
        };
        //check instanceID
        if ($scope.instanceId ) {
            options.instanceId = $scope.instanceId;
        }
        dynamicEngineService.expressions.evaluate(options, (err, evaluatedExpression) => {
            $scope.isEvaluateLoading = false;
            if (err) {
                $scope.error = "Error: " + err.message;
                $scope.expression.evaluatedExpression = "";
                if (!$scope.$$phase) $scope.$digest();
                return;
            }
            $scope.expression.evaluatedExpression = evaluatedExpression;
            if (!$scope.$$phase) $scope.$digest();
        });
    };

    const start = () => {
        $scope.$dialog = $dialog;
        $scope.expression = {
            string: "",
            evaluatedExpression: ""
        };
        $scope.error = "";
        $scope.isEvaluateLoading = false;
        $scope.isInitLoading = true;
        $scope.presetsExpressions = [];
        $scope.pluginCustomExpressions = [];
        $scope.expressionScope = 'cp';
        $scope.instanceId = '';
        //coming from SDK/plugin
        if ($data && $data.options && $data.options.instanceId) {
            $scope.expressionScope = 'app';
            $scope.instanceId = $data.options.instanceId;
        } else if ($data && $data.instanceId) {
            //coming from plugin tester CP/plugin-Language settings.
            $scope.expressionScope = 'app';
            $scope.instanceId = $data.instanceId;
        }
        //check if there a string to be initialized
        if ($data && $data.string) {
            $scope.expression.string = $data.string;
        }
        const appHost = window.siteConfig.endPoints.appHost;
        const presetsExpressionJsonPath = appHost + `/scripts/expressions/presetsExpressions.json?v=${(new Date()).getTime()}`;
        $http.get(presetsExpressionJsonPath)
        .success((response)=>{
            if ($scope.expressionScope == 'cp') {
                $scope.isInitLoading = false;
                $scope.presetsExpressions = response;
            } else {
                const options = {
                    instanceId: $scope.instanceId
                };
                //check if plugin has custom expressions.
                Dynamic.expressions.triggerRequestCustomExpressions(options, (err, res) => {
                    if (err) {
                        console.error(err);
                        setTimeout(() => {
                            $scope.close();
                            window.toast('Error getting Plugin Custom expressions', 'danger');
                        }, 3000);
                        return;
                    }
                    if (res && res.expressions) {
                        $scope.pluginCustomExpressions = res.expressions;
                    }
                    $scope.presetsExpressions = response;
                    $scope.isInitLoading = false;
                    if (!$scope.$$phase) $scope.$digest();

                });
            }
        })
        .error((err)=>{
            console.error(err);
            setTimeout(() => {
                $scope.close();
                console.error(err);
                window.toast('Error fetching presets expressions Json', 'danger');
            }, 3000);
        });
       

    };

    start();
}]);

