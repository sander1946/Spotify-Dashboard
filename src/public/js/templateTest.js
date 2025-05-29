renderTemplate("main", "logged-in-template", userData);
renderTemplate("oauth", "oauth-template", currentToken);
renderTemplate("main", "login");

example_html = ```
<!-- there are the target area's -->
<div id="main">

</div>
<div id="oauth">

</div>

<!-- these are the templates to load -->
<template id="login">
  <h1>Welcome to the OAuth2 PKCE Example</h1>
  <button id="login-button" data-bind-onclick="loginWithSpotifyClick();"> Log in with Spotify </button>
</template>

<template id="logged-in-template">
  <h1>Logged in as <span data-bind="display_name"></span></h1>
  <img width="150" data-bind-src="images[0].url" data-bind-alt="display_name" />
  <table>
    <tr>
      <td>Display name</td>
      <td data-bind="display_name"></td>
    </tr>
    <tr>
      <td>Id</td>
      <td data-bind="id"></td>
    </tr>
    <tr>
      <td>Email</td>
      <td data-bind="email"></td>
    </tr>
    <tr>
      <td>Spotify URI</td>
      <td>
        <a data-bind="external_urls.spotify" data-bind-href="external_urls.spotify"></a>
      </td>
    </tr>
    <tr>
      <td>Link </dt>
      <td>
        <a data-bind="href" data-bind-href="href"></a>
      </td>
    </tr>
    <tr>
      <td>Profile Image</td>
      <td>
        <a data-bind-href="images[0].url" data-bind="images[0].url"></a>
      </td>
    </tr>
    <tr>
      <td>Country</td>
      <td data-bind="country"></td>
    </tr>
  </table>

  <button id="refresh-token-button" data-bind-onclick="refreshTokenClick();">Refresh Token</button>
  <button id="logout-button" data-bind-onclick="logoutClick();">Log out</button>
</template>

<template id="oauth-template">
  <h2>oAuth info</h2>
  <table>
    <tr>
      <td>Access token</td>
      <td data-bind="access_token"></td>
    </tr>
    <tr>
      <td>Refresh token</td>
      <td data-bind="refresh_token"></td>
    </tr>
    <tr>
      <td>Expiration at</td>
      <td data-bind="expires">${getExpirationDate(expires_in)}</td>
    </tr>
  </table>
</template>
```


// HTML Template Rendering with basic data binding - demoware only.
function renderTemplate(targetId, templateId, data = null) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true);

  const elements = clone.querySelectorAll("*");
  elements.forEach(ele => {
    const bindingAttrs = [...ele.attributes].filter(a => a.name.startsWith("data-bind"));

    bindingAttrs.forEach(attr => {
      const target = attr.name.replace(/data-bind-/, "").replace(/data-bind/, "");
      const targetType = target.startsWith("onclick") ? "HANDLER" : "PROPERTY";
      const targetProp = target === "" ? "innerHTML" : target;

      const prefix = targetType === "PROPERTY" ? "data." : "";
      const expression = prefix + attr.value.replace(/;\n\r\n/g, "");

      // Maybe use a framework with more validation here ;)
      try {
        ele[targetProp] = targetType === "PROPERTY" ? eval(expression) : () => { eval(expression) };
        ele.removeAttribute(attr.name);
      } catch (ex) {
        console.error(`Error binding ${expression} to ${targetProp}`, ex);
      }
    });
  });

  const target = document.getElementById(targetId);
  target.innerHTML = "";
  target.appendChild(clone);
}