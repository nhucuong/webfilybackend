$(document).ready(function () {

  const DEFAULT_LOGO = "/images/logos/logo.svg";
  const DEFAULT_FAVICON = "/images/logos/favicon.jpg";

  $.get("/getSettingjson", function (res) {

    // ===============================
    // DEFAULT FIRST (NO CHANGE UI)
    // ===============================
    $(".logo-full").attr("src", DEFAULT_LOGO);
    $(".logo-mini").attr("src", DEFAULT_FAVICON);

    $(".dark-logo, .light-logo").attr("src", DEFAULT_FAVICON);
    $(".responsive-light, .responsive-dark").attr("src", DEFAULT_FAVICON);

    $("#dynamic-favicon").attr("href", DEFAULT_FAVICON);
    $("#login-favicon").attr("href", DEFAULT_FAVICON);

    $("#dynamic-favicon-loader").attr("src", DEFAULT_FAVICON);
    $("#login-loader").attr("src", DEFAULT_FAVICON);

    if (!res.success || !res.data) return;

    const { logo, favicon } = res.data;

    // ===============================
    // LOGO FROM SETTINGS
    // ===============================
    if (logo && logo.trim() !== "") {
      $(".logo-full").attr("src", logo);
    }

    // ===============================
    // FAVICON FROM SETTINGS
    // ===============================
    if (favicon && favicon.trim() !== "") {

      $(".logo-mini").attr("src", favicon);

      $(".dark-logo, .light-logo").attr("src", favicon);
      $(".responsive-light, .responsive-dark").attr("src", favicon);

      $("#dynamic-favicon").attr("href", favicon);
      $("#login-favicon").attr("href", favicon);

      $("#dynamic-favicon-loader").attr("src", favicon);
      $("#login-loader").attr("src", favicon);
    }

  });

});
