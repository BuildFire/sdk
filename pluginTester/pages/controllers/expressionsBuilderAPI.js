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
        //reset values
        $scope.error = "";
        $scope.expression.evaluatedExpression = "";
        
        if (!expressionsService) {
            $scope.error = "Expressions Service not defined!";
            window.toast($scope.error, 'danger');
            return;
        }

        $scope.isEvaluateLoading = true;
        const options = {
            expression: $scope.expression.string
        };
        //check if dialog requested by CP or SDK
        if ($data && $data.options && $data.options.instanceId ) {
            options.instanceId = $data.options.instanceId;
        }
        expressionsService.evaluate(options, (err, evaluatedExpression) => {
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
        $scope.expressionScope = 'cp';
        
        if ($data && $data.options && $data.options.instanceId) {
            $scope.expressionScope = 'app';
        }
        const appHost = "https://uat3-app.buildfire.com"; //to be changed on prod deployment.
        // const appHost = window.siteConfig.endPoints.appHost;
        const presetsExpressionJsonPath = appHost + `/scripts/expressions/presetsExpressions.json?v=${(new Date()).getTime()}`;
        $http.get(presetsExpressionJsonPath)
        .success((response)=>{
            $scope.presetsExpressions = response;
            $scope.isInitLoading = false;
        })
        .error((err)=>{
            setTimeout(() => {
                $scope.close();
                console.error(err);
                window.toast('Error fetching presets expressions Json', 'danger');
            }, 1000);
            $scope.isInitLoading = false;
        });
       

    };

    start();
}]);

