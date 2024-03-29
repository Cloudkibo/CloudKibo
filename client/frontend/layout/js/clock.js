
/*
 * Starts any clocks using the user's local time
 * From: cssanimation.rocks/clocks
 */
 var refreshIntervalId_seconds;
  var refreshIntervalId_minutes;
  var refreshIntervalId_hours; 
 myclockStart = function(){
   
  $('#calendar').datepicker({
        inline: true,
        firstDay: 1,
        showOtherMonths: true,
        dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    });
  console.log('Jquery loaded version is ' + $().jquery);
  initLocalClocks();
  moveSecondHands();
  setUpMinuteHands();
} 
function aftermeetingstop()
{
  console.log('i am called');
  initLocalClocks();
  moveSecondHands();
  setUpMinuteHands();
}
function initLocalClocks() {
  // Get the local time using JS
  var date = new Date;
  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  var hours = date.getHours();

  // Create an object with each hand and it's angle in degrees
  var hands = [
    {
      hand: 'hours',
      angle: (hours * 30) + (minutes / 2)
    },
    {
      hand: 'minutes',
      angle: (minutes * 6)
    },
    {
      hand: 'seconds',
      angle: (seconds * 6)
    }
  ];
  // Loop through each of these hands to set their angle
  for (var j = 0; j < hands.length; j++) {
    var elements = document.querySelectorAll('.' + hands[j].hand);
    for (var k = 0; k < elements.length; k++) {
        elements[k].style.webkitTransform = 'rotateZ('+ hands[j].angle +'deg)';
        elements[k].style.transform = 'rotateZ('+ hands[j].angle +'deg)';
        // If this is a minute hand, note the seconds position (to calculate minute position later)
        if (hands[j].hand === 'minutes') {
          elements[k].parentNode.setAttribute('data-second-angle', hands[j + 1].angle);
        }
    }
  }
}

/*
 * Set a timeout for the first minute hand movement (less than 1 minute), then rotate it every minute after that
 */
function setUpMinuteHands() {
  // Find out how far into the minute we are
  var containers = $('.minutes-container');
  console.log('Minutes container length : '+containers.length);
  if (containers.length == 0) {
    location.reload();
   }
  else
  {    
      var secondAngle = containers[0].getAttribute("data-second-angle");
      if (secondAngle > 0) {
        // Set a timeout until the end of the current minute, to move the hand
        var delay = (((360 - secondAngle) / 6) + 0.1) * 1000;
        setTimeout(function() {
          moveMinuteHands(containers);
        }, delay);
      }
  }
}

/*
 * Do the first minute's rotation
 */
function moveMinuteHands(containers) {
  for (var i = 0; i < containers.length; i++) {
    containers[i].style.webkitTransform = 'rotateZ(6deg)';
    containers[i].style.transform = 'rotateZ(6deg)';
  }
  // Then continue with a 60 second interval
  refreshIntervalId_minutes = setInterval(function() {
    for (var i = 0; i < containers.length; i++) {
      if (containers[i].angle === undefined) {
        containers[i].angle = 12;
      } else {
        containers[i].angle += 6;
      }
      containers[i].style.webkitTransform = 'rotateZ('+ containers[i].angle +'deg)';
      containers[i].style.transform = 'rotateZ('+ containers[i].angle +'deg)';
    }
  }, 60000);
}

/*
 * Move the second containers
 */
 
  
 /*** call when meeting started ***/ 
function call_me_toclear()
{
  clearInterval(refreshIntervalId_seconds);
  clearInterval(refreshIntervalId_minutes);
  clearInterval(refreshIntervalId_hours);
}  
function moveSecondHands() {
  var containers = $('.seconds-container');
  console.log('Seconds container length : '+ containers.length);
  if (containers.length == 0) {
 //   location.reload();
   }
  else
  {  
    refreshIntervalId_seconds =  setInterval(function() {
        for (var i = 0; i < containers.length; i++) {
          if (containers[i].angle === undefined) {
            containers[i].angle = 6;
          } else {
            containers[i].angle += 6;
          }
          containers[i].style.webkitTransform = 'rotateZ('+ containers[i].angle +'deg)';
          containers[i].style.transform = 'rotateZ('+ containers[i].angle +'deg)';
        }
      }, 1000);
  }
}