$app.controller('notesCtrl', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {
  $scope.notes = [];
  $scope.notesShown = false;
  // $scope.pluginNav = true;
  $scope.tempNoteData = {};
  $scope.notes = [];

  window.notesAPI.notesCtrlScope = $scope;

  $scope.close = function () {
    $scope.notesShown = false;
  }
  $scope.$watch('notesShown', () => {
    if ($scope.notesShown) {
      window.notesAPI.getAllFromPlugin((err, notes) => {
        $scope.notes = notes;
      });
      if (!$scope.$$phase) {
        $scope.apply();
      }
    }
  }, true);
  $scope.$watch('notes', () => console.log($scope.notes), true);
  $scope.addNote = function () {
    const options = {
      title: $scope.tempNoteData.title,
      description: $scope.tempNoteData.description,
      timeIndex: $scope.tempNoteData.timeIndex || 0
    };
    window.notesAPI.add(options);
  }
}]);
