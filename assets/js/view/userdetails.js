$(document).ready(function () {

  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };

  /* ============================
     USER BAN / ACTIVE SWITCH
  ============================= */
  const banSwitch = $("#banSwitch");
  const banText = $("#banText");

  let userStatus = Number(banSwitch.data("status")); // 1 / 2 / 3
  const userId = banSwitch.data("userid");

  banSwitch.on("change", function () {

    $.post(`/userstatus/${userId}`, {}, function (res) {

      if (res.success) {

        // Toggle only between 1 & 2
        if (userStatus === 1) {
          userStatus = 0;
          banSwitch.prop("checked", false);
          banText.text("Inactive");
        } else if (userStatus === 0) {
          userStatus = 1;
          banSwitch.prop("checked", true);
          banText.text("Active");
        }

        toastr.success(res.message || "User status updated");

      } else {
        // revert UI
        banSwitch.prop("checked", userStatus === 1);
        toastr.error(res.message || "Failed to update user status");
      }

    }).fail(() => {
      banSwitch.prop("checked", userStatus === 1);
      toastr.error("Server error occurred");
    });

  });



  /* ============================
     EMAIL VERIFICATION SWITCH
  ============================= */
  const emailSwitch = $("#emailVerifySwitch");
  const emailText = $("#emailVerifyText");
  let emailStatus = emailSwitch.prop("checked");

  emailSwitch.on("change", function () {

    $.post(`/emailverify/${emailSwitch.data("userid")}`, {}, function (res) {

      if (res.success) {

        emailStatus = !emailStatus; // flip

        emailText.text(emailStatus ? "Verified" : "Not Verified");

        toastr.success(res.message || "Email verification status updated");

      } else {
        // revert back on fail
        emailSwitch.prop("checked", emailStatus);
        toastr.error(res.message || "Failed to update email status");
      }

    }).fail(() => {
      emailSwitch.prop("checked", emailStatus);
      toastr.error("Server error occurred");
    });

  });



});
function loginasuser(id) {
  console.log(id);
  $.post(`/login-as-user/${id}`, {}, function (res) {

    if (res.success) {
      if (res.url) {
        window.open(res.url, "_blank"); // ya same tab
      }
    } else {
      toastr.error(res.message || "Failed to login user");
    }

  }).fail(() => {
    toastr.error("Server error occurred");
  });

}