var streamHandle;
var photo = new Blaze.ReactiveVar(null);
var closeAndCallback;

Template.viewfinder.rendered = function() {
  var template = this;

  var streaming = false;
  var video = template.find("video");
  var canvas = template.find("canvas");
  var width = 320;
  var height = 240;

  // tons of different browser prefixes
  navigator.getMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );

  var success = function(stream) {
    streamHandle = stream;
    if (navigator.mozGetUserMedia) {
      video.mozSrcObject = stream;
    } else {
      var vendorURL = window.URL || window.webkitURL;
      video.src = vendorURL.createObjectURL(stream);
    }
    video.play();
  };

  var failure = function(err) {
    console.log("An error occured! " + err);
  };

  navigator.getMedia({
      video: true,
      audio: false
  }, success, failure);

  video.addEventListener('canplay', function() {
    if (! streaming) {
      height = video.videoHeight / (video.videoWidth / width);
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);
};

Template.camera.helpers({
  photo: function () {
    return photo.get();
  }
});

Template.camera.events({
  "click .use-photo": function (event, template) {
    closeAndCallback(null, photo.get());
  },
  "click .new-photo": function () {
    photo.set(null);
  }
});

Template.viewfinder.events({
  'click .shutter': function (event, template) {
    var video = template.find("video");
    var canvas = template.find("canvas");
    var width = 640;
    var height = 480;

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    var data = canvas.toDataURL('image/png');
    photo.set(data);
    streamHandle.stop();
  },
  "click .cancel": function () {
    closeAndCallback(new Meteor.Error("cancel", "Photo taking was cancelled."));
    streamHandle.stop();
  }
});

MeteorCamera.getPicture = function (callback) {
  var view;
  
  closeAndCallback = function () {
    var originalArgs = arguments;
    UI.remove(view);
    photo.set(null);
    callback.apply(null, originalArgs);
  };
  
  view = UI.renderWithData(Template.camera);
  UI.insert(view, document.body);
};
