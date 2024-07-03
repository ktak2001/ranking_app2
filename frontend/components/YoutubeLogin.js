import React from "react";

export default function YoutubeLogin() {
  const generateCryptoRandomState = () => {
    const randomValues = new Uint32Array(2);
    window.crypto.getRandomValues(randomValues);

    // Encode as UTF-8
    const utf8Encoder = new TextEncoder();
    const utf8Array = utf8Encoder.encode(
      String.fromCharCode.apply(null, randomValues)
    );

    // Base64 encode the UTF-8 data
    return btoa(String.fromCharCode.apply(null, utf8Array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }


  const oauth2SignIn = () => {
    var state = generateCryptoRandomState()
    localStorage.setItem('state', state)
  
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);
    var params = {'client_id': '208750319210-op24irglip1eorvs6pc41qf1lono0ti6.apps.googleusercontent.com',
    'redirect_uri': `${process.env.NEXT_PUBLIC_WEB_URL}/youtube_login_success`,
    'response_type': 'token',
    'scope': 'https://www.googleapis.com/auth/youtube.readonly',
    'include_granted_scopes': 'true',
    'state': state,
    'prompt': 'select_account'
    }
    for (var p in params) {
      var input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', p);
      input.setAttribute('value', params[p]);
      form.appendChild(input);
    }
  
    document.body.appendChild(form);
    form.submit();
  }
  return (
    <button onClick={oauth2SignIn} className="btn btn-outline-primary">
      自身のYoutubeチャンネルを登録
    </button>
  )
}
