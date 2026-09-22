$(document).ready(function () {

    toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000"
  };


  $("#updateNameForm").on("submit", function (e) {
    e.preventDefault();

    $.ajax({
      url: "/changepassword",
      method: "POST",
      data: $(this).serialize(),
      success: function (res) {
        if (res.success && res.name) {
          $("#adminName, #adminNavName, #adminProfileName").text(res.name);
          $("#nameinput").val(res.name);

            toastr.success(res.message || "Name updated successfully");
        } else {
          toastr.error(res.message || "Failed to update name");
        }
      },
      error: () => toastr.error("Something went wrong")
    });
  });

});
$(document).ready(function () {

  $("#changePasswordForm").on("submit", function (e) {
    e.preventDefault();

    $.ajax({
      url: "/changepassword",
      method: "POST",
      data: $(this).serialize(),
      success: function (res) {
        if (res.success) {
         toastr.success(res.message || "Password changed successfully");
          $("#changePasswordForm")[0].reset();
        } else {
           toastr.error(res.message || "Password change failed");
        }
      },
      error: function () {
         toastr.error("Something went wrong");
      }
    });
  });

});


const cameraBtn = document.getElementById("cameraBtn");
const profileInput = document.getElementById("profileInput");
const profilePreview = document.querySelectorAll(".profilePreview");

// Camera click → open file chooser
cameraBtn.addEventListener("click", () => {
    profileInput.click();
});

// File select → preview + upload
profileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const oldImages = [];
    profilePreview.forEach(p => oldImages.push(p.src));

    // temp preview
    const reader = new FileReader();
    reader.onload = () => {
        profilePreview.forEach(p => p.src = reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch("/adminimage", {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        console.log(data);
        
        //  STRICT SUCCESS CHECK
        const isSuccess =
            res.status === 200 &&
            data.success === true;

        // ERROR
        if (!isSuccess) {
  toastr.error(data.message || "Image upload failed");

            profilePreview.forEach((p, i) => p.src = oldImages[i]);
            profileInput.value = "";
            return;
        }

        //  SUCCESS
        if (data.profile) {
            profilePreview.forEach(p => p.src = data.profile);
        }

          toastr.success("Profile image updated successfully");
    } catch (err) {
        profilePreview.forEach((p, i) => p.src = oldImages[i]);

       toastr.error("Something went wrong");
    }
});

