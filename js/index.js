// Initialize Firebase
  var config = {
    apiKey: "AIzaSyAeTiIQF4kVWu3iy3xGMkx8kJ8SY7gTES4",
    authDomain: "train-times-29de0.firebaseapp.com",
    databaseURL: "https://train-times-29de0.firebaseio.com",
    projectId: "train-times-29de0",
    storageBucket: "train-times-29de0.appspot.com",
    messagingSenderId: "110990722187"
  };
  firebase.initializeApp(config);

  var db = firebase.database();
  var currentIndex = '00';
  var new_train = false;

  // Check if user signed in
  firebase.auth().onAuthStateChanged(function(user) {
    
    if (user) {
      toggleSignIn(user);
    } 
});

function toggleSignIn(user) {
  var state = $('#welcome').css('display');
  if (state == 'block') {
      $('#welcome').css({display: 'none'});
      $('#login-register').css({display: 'block'});
  } else {
      // var signed_in = firebase.auth().currentUser;
      db.ref('/users/'+user.email.replace(/[\.|#|$|\[|\]]/g, '_')).on('value', function(snapshot) {
        $('#welcome-text').text('Welcome, ' + snapshot.val().first_name + ' ' + snapshot.val().last_name + '!');
        $('#login-register').css({display: 'none'});
        $('#welcome').css({display: 'block'});
      });
  }
}

  // Pull trains on page load
  db.ref('/trains').once('value').then(function(snapshot) {
    refreshBoard(snapshot);
  });

// Submit new train handler
$('#submit-button').on('click', function() {

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      console.log("took it")
      new_train = true;
      db.ref('/trains/train'+currentIndex).set({
          destination: $('#destination').val(),
          first_train_time: $('#first-time').val(),
          frequency: $('#frequency').val(),
          train_name: $('#train-name').val()
      })

      $('#destination').val('')  
      $('#first-time').val('')
      $('#frequency').val('')
      $('#train-name').val('')
      
    } else {
      // No user is signed in.
      alert("You must be signed in to use the system!");
      return;
    }
  });

});

// Refresh Results every minute
setInterval(function() {
  db.ref('/trains').on('value',function(snapshot) {
    refreshBoard(snapshot);
  });
}, 60000);

// New train listener
db.ref('/trains').on('value',function(snapshot) {
    if (new_train) {
      pullNewTrain(snapshot);
      new_train = false;
    }
});

// Adds a new train to the list
function pullNewTrain(snapshot) {
    var new_train = snapshot.val()['train'+currentIndex];
    var start = moment(new_train.first_train_time, 'HH:mm')

    while (moment().diff(start, 'minutes') > 0) {
        start.add(parseInt(new_train.frequency), 'm');
      }

      var minutes_away = (moment().diff(start, 'minutes') == 0) ? "Currently Boarding!" : start.fromNow();

      var row = "<tr>" +
                  "<td>" + new_train.train_name  + "</td>" +
                    "<td>" + new_train.destination + "</td>" +
                    "<td>" + new_train.frequency + "</td>" +
                      "<td>" + start.format('h:mma') + "</td>" +
                      "<td>" + minutes_away + "</td>" +
                "</tr>";

      $('#train-board').append(row);

    currentIndex = (parseInt(currentIndex)+1).toString();
    if (currentIndex < 10) currentIndex = '0'+currentIndex;
}

// Pulls fresh values for all trains
function refreshBoard(snapshot) {
    
  // Return if no trains
  if (!snapshot.val()) return;

    $('#train-board').html('');
    var trains = snapshot.val();
    var keys = Object.keys(trains);
    currentIndex = keys[keys.length-1].slice(5);
    for (var o in trains) {
        var start = moment(trains[o].first_train_time, 'HH:mm')

        while (moment().diff(start, 'minutes') > 0) {
          start.add(parseInt(trains[o].frequency), 'm');
        }
        var boarding_message = "Currently Boarding!";
        var minutes_away = (moment().diff(start, 'minutes') == 0) ? boarding_message : start.fromNow();
        var boarding_class = (minutes_away == boarding_message) ? ' currently-boarding' : '';
        var row = "<tr>" +
                    "<td>" + trains[o].train_name  + "</td>" +
                     "<td>" + trains[o].destination + "</td>" +
                      "<td>" + trains[o].frequency + "</td>" +
                       "<td>" + start.format('h:mma') + "</td>" +
                        "<td class=" + boarding_class + ">" + minutes_away + "</td>" +
                  "</tr>";

        $('#train-board').append(row);

        
    }
    
    currentIndex = (parseInt(currentIndex)+1).toString();
    if (currentIndex < 10) currentIndex = '0'+currentIndex;
}

// Login
$('#login-register').on('click', function() {
  loginFormat();
  $('#login-modal').modal('show');
});
$('#register').on('click', function() {
  registerFormat();
});
$('#login-button').on('click', function() {
  signIn();
})
$('#register-button').on('click', function() {
  register();
})

function registerFormat() {
  $('#new-user').css({display: 'none'});
  $('#login-button').css({display: 'none'});
  $('#register-button').css({display: 'block'});
  $('#first-name').css({display: 'inline-block'});
  $('#last-name').css({display: 'inline-block'});
  $('#first-name-label').css({display: 'inline-block'});
  $('#last-name-label').css({display: 'inline-block'});
  $('.modal-title').text('New User Registrations')
}

function loginFormat() {
  $('#new-user').css({display: 'block'});
  $('#login-button').css({display: 'inline-block'});
  $('#register-button').css({display: 'none'});
  $('#first-name').css({display: 'none'});
  $('#last-name').css({display: 'none'});
  $('#first-name-label').css({display: 'none'});
  $('#last-name-label').css({display: 'none'});
  $('.modal-title').text('Please sign in...')
}

$('#sign-out').on('click', function() {
  firebase.auth().signOut();
  toggleSignIn();
});

function signIn() {
  if (firebase.auth().currentUser) {
        // [START signout]
        alert("You are already logged in!");
        return;
        firebase.auth().signOut();
        // [END signout]
      } else {
        var email = $('#email').val();
        var password = $('#password').val();;
        if (email.length < 4) {
          alert('Please enter an email address.');
          return;
        }
        if (password.length < 4) {
          alert('Please enter a password.');
          return;
        }
        // Sign in with email and pass.
        // [START authwithemail]
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // [START_EXCLUDE]
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
          
          // [END_EXCLUDE]
        });
        $('#login-modal').modal('hide');
        // [END authwithemail]
      }
      
}

function register() {

  // Sign out in case another user is currently signed in on client
  firebase.auth().signOut();

    var success = true;
    var first_name = $('#first-name').val();
    var last_name = $('#last-name').val();
    var email = $('#email').val();
    var password = $('#password').val();
    if (email.length < 4) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 4) {
      alert('Please enter a password.');
      return;
    }
    if (email.length == 0) {
      alert('Please enter your first name.');
      return;
    }
    if (password.length == 0) {
      alert('Please enter your last name.');
      return;
    }
    // Sign in with email and pass.
    // [START createwithemail]
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        success = false;
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/weak-password') {
          alert('The password is too weak.');
        } else {
          alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
      });
    // [END createwithemail]

    if (success) {
      $('#login-modal').modal('hide');
      db.ref('/users/'+email.replace(/[\.|#|$|\[|\]]/g, '_')).set({
        first_name: first_name,
        last_name: last_name
      })
      toggleSignIn();
    }

}