     window.fbAsyncInit = function() {
        FB.init({
          appId      : '456637644436523',
          status     : true,
          xfbml      : true
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "//connect.facebook.net/en_US/all.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));
      
      FB.ui(
      {
       method: 'feed',
       name: 'CloudKibo',
       caption: 'Video calls were never that easy...',
       description: (
          'Hello, I am using CloudKibo to do Video Calls, File Transfering, IM & Screen Sharing.' +
          'Follow the link and get connected to me on CloudKibo.' +
          'Let us have a Video Chat and File Transfering at an amazingly fast speed.'
       ),
       link: 'https://www.cloudkibo.com',
       picture: 'http://www.fbrell.com/public/f8.jpg'
      },
      function(response) {
        if (response && response.post_id) {
          alert('Post was published.');
        } else {
          alert('Post was not published.');
        }
      }
